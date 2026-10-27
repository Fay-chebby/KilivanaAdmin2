import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { DisputeDto, OrderLiteDto } from '../models/Dispute api.model';
import {
  Category,
  Dispute,
  DisputeImage,
  DisputeNote,
  DisputeStatus,
  Outcome,
  SLA_HOURS,
  slaInfo,
} from '../models/dispute.model';
import { DisputeApi } from './Dispute.api';

const KEY = 'agriadmin.disputes.local.v1';
const now = () => new Date().toISOString().slice(0, 16);
const day16 = (iso?: string | null) => (iso ? iso.slice(0, 16) : now());
const addHours = (iso: string, h: number) =>
  new Date(new Date(iso).getTime() + h * 36e5).toISOString().slice(0, 16);
const uid = () => crypto.randomUUID();

const note = (
  at: string,
  from: DisputeNote['from'],
  text: string,
  o: Partial<DisputeNote> = {},
): DisputeNote => ({ id: uid(), at, from, internal: false, to: null, text, ...o });

const guess = (t: string): Category =>
  /arriv|receiv|deliver/i.test(t)
    ? 'not_received'
    : /bruis|damag|broken|crush/i.test(t)
      ? 'damaged'
      : /moisture|quality|grade|rotten|spoil/i.test(t)
        ? 'quality'
        : /short|quantity|missing|less/i.test(t)
          ? 'quantity'
          : 'other';

/** What the backend cannot store yet. Kept in this browser so nothing is lost while you work. */
interface Local {
  notes: DisputeNote[];
  escalated: { at: string; reason: string } | null;
  reviewer: string | null;
  outcome: Outcome | null;
}
const EMPTY: Local = { notes: [], escalated: null, reviewer: null, outcome: null };

function errMsg(e: unknown): string {
  const x = e as {
    status?: number;
    message?: string;
    error?: { message?: string; error?: { details?: string } };
  };
  if (x?.status === 0)
    return 'Cannot reach the server. Check the ngrok address and that the backend is running.';
  if (x?.status === 401) return 'Your session has expired. Please sign in again.';
  if (x?.status === 403) return 'The server refused this action for your account (403).';
  return x?.error?.message || x?.error?.error?.details || x?.message || 'Something went wrong.';
}

/**
 * Disputes from the Kilivana backend, joined with their orders for buyer, farmer and amount.
 * Stored on the server: the dispute itself, its status and its resolution.
 * Not stored on the server yet (see the backend change request): internal notes, evidence photos, escalation, reviewer.
 */
@Injectable({ providedIn: 'root' })
export class DisputeService {
  private readonly api = inject(DisputeApi);

  private readonly dtos = signal<DisputeDto[]>([]);
  private readonly orders = signal<Map<number, OrderLiteDto>>(new Map());
  private readonly local = signal<Record<string, Local>>(this.read());
  private readonly evidence = signal<Record<string, DisputeImage[]>>({});

  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly warning = signal<string | null>(null);
  private loadPromise: Promise<void> | null = null;

  /** What this backend supports today. Flip a flag when the backend adds the feature. */
  readonly caps = { partialRefund: false };

  /** ticks every minute so deadlines on screen stay current */
  readonly clock = signal(Date.now());

  readonly disputes = computed<Dispute[]>(() => {
    const orders = this.orders();
    const local = this.local();
    const ev = this.evidence();
    return this.dtos().map((d) =>
      this.build(d, orders.get(d.orderId), local[String(d.id)] ?? EMPTY, ev[String(d.id)] ?? []),
    );
  });

  readonly stats = computed(() => {
    const l = this.disputes();
    const open = l.filter((d) => d.status !== 'resolved');
    return {
      open: l.filter((d) => d.status === 'open').length,
      inReview: l.filter((d) => d.status === 'in_review').length,
      escalated: l.filter((d) => d.status === 'escalated').length,
      resolved: l.filter((d) => d.status === 'resolved').length,
      atStake: open.reduce((a, d) => a + d.amountKes, 0),
      overdue: open.filter((d) => slaInfo(d, this.clock()).state === 'overdue').length,
    };
  });

  constructor() {
    const t = setInterval(() => this.clock.set(Date.now()), 60000);
    inject(DestroyRef).onDestroy(() => clearInterval(t));
  }

  /** Accepts the dispute id, or the order id (used by the "Open in Disputes" link on an order) */
  get(id: string) {
    return (
      this.disputes().find((d) => d.id === id) ?? this.disputes().find((d) => d.orderId === id)
    );
  }
  byOrder(orderId: string) {
    return this.disputes().find((d) => d.orderId === orderId);
  }

  // ---------------- loading ----------------
  ensureLoaded(): Promise<void> {
    return (this.loadPromise ??= this.load());
  }

  async load(silent = false): Promise<void> {
    if (!silent) this.loading.set(true);
    this.error.set(null);
    try {
      const { disputes, orders } = await this.api.listDisputes();
      this.dtos.set(disputes);
      this.orders.set(new Map(orders.map((o) => [o.id, o])));
      this.loaded.set(true);
    } catch (e) {
      this.error.set(errMsg(e));
      this.loadPromise = null;
    } finally {
      this.loading.set(false);
    }
  }

  // ---------------- actions ----------------
  async startReview(id: string): Promise<boolean> {
    const ok = await this.run(() => this.api.setStatus(Number(id), 'in_progress').then(() => true));
    if (!ok) return false;
    this.patchLocal(id, (l) => ({
      ...l,
      reviewer: l.reviewer ?? 'Admin',
      notes: [...l.notes, note(now(), 'system', 'Admin started reviewing this dispute.')],
    }));
    await this.load(true);
    return true;
  }

  async escalate(id: string, reason: string): Promise<boolean> {
    const d = this.get(id);
    if (d?.status === 'open') {
      const ok = await this.run(() =>
        this.api.setStatus(Number(id), 'in_progress').then(() => true),
      );
      if (!ok) return false;
    }
    this.patchLocal(id, (l) => ({
      ...l,
      reviewer: l.reviewer ?? 'Admin',
      escalated: { at: now(), reason },
      notes: [...l.notes, note(now(), 'system', `Escalated by Admin: ${reason}`)],
    }));
    await this.load(true);
    return true;
  }

  /** Internal notes stay on this device. Messages to the buyer or farmer are also sent as an in-app notification. */
  async post(id: string, text: string, mode: 'internal' | 'buyer' | 'farmer'): Promise<boolean> {
    const d = this.get(id);
    if (!d) return false;
    if (mode !== 'internal') {
      const userId = Number(mode === 'buyer' ? d.buyerId : d.farmerId);
      if (!userId) {
        this.error.set(`We could not find the ${mode}'s account on this order.`);
        return false;
      }
      const ok = await this.run(() =>
        this.api
          .notify({ userId, type: 'DISPUTE_MESSAGE', title: `Dispute ${d.code}`, message: text })
          .then(() => true),
      );
      if (!ok) return false;
    }
    this.patchLocal(id, (l) => ({
      ...l,
      notes: [
        ...l.notes,
        note(now(), 'admin', text, {
          internal: mode === 'internal',
          to: mode === 'internal' ? null : mode,
        }),
      ],
    }));
    return true;
  }

  addEvidence(id: string, items: { url: string; name: string }[]) {
    const imgs: DisputeImage[] = items.map((i) => ({
      id: uid(),
      url: i.url,
      caption: i.name,
      by: 'admin',
      at: now(),
    }));
    this.evidence.update((m) => ({ ...m, [id]: [...(m[id] ?? []), ...imgs] }));
  }
  removeEvidence(id: string, imageId: string) {
    this.evidence.update((m) => ({ ...m, [id]: (m[id] ?? []).filter((e) => e.id !== imageId) }));
  }

  /** Closes the dispute on the server with the outcome and note. Partial refunds are not supported by the backend yet. */
  async resolve(
    id: string,
    outcome: Outcome,
    noteText: string,
    _refundKes: number,
  ): Promise<boolean> {
    if (outcome === 'partial_refund' && !this.caps.partialRefund) {
      this.error.set(
        'Partial refunds are not supported by the server yet. Choose to refund the buyer or pay the farmer.',
      );
      return false;
    }
    const ok = await this.run(async () => {
      await this.api.resolve(Number(id), {
        outcome: outcome === 'refund_buyer' ? 'BUYER' : 'FARMER',
        resolution: noteText,
      });
      // some backends only set the text, so make sure the status moves too
      await this.api.setStatus(Number(id), 'resolved').catch(() => undefined);
      return true;
    });
    if (!ok) return false;
    this.patchLocal(id, (l) => ({
      ...l,
      outcome,
      notes: [
        ...l.notes,
        note(
          now(),
          'system',
          `Resolved: ${outcome === 'refund_buyer' ? 'buyer refunded in full' : 'farmer paid in full'}. ${noteText}`,
        ),
      ],
    }));
    await this.load(true);
    this.checkMoney(id, outcome);
    return true;
  }

  // ---------------- helpers ----------------
  /** The server closes the dispute, but it may not move the money. Tell the admin if the payment did not follow. */
  private checkMoney(id: string, outcome: Outcome) {
    const d = this.get(id);
    const o = d ? this.orders().get(Number(d.orderId)) : undefined;
    const pay = (o?.paymentStatus ?? '').toLowerCase();
    if (!o || !pay) return;
    if (outcome === 'refund_buyer' && pay !== 'refunded')
      this.warning.set(
        `The dispute is resolved, but the payment on ${o.code ?? 'the order'} is still "${pay}". Refund it from the Orders page so the buyer gets the money back.`,
      );
    else if (outcome === 'pay_farmer' && pay !== 'settled')
      this.warning.set(
        `The dispute is resolved, but the payment on ${o.code ?? 'the order'} is still "${pay}". Release the payment from the Orders page so the farmer is paid.`,
      );
    else this.warning.set(null);
  }

  private async run<T>(fn: () => Promise<T>): Promise<T | null> {
    this.busy.set(true);
    this.error.set(null);
    try {
      return await fn();
    } catch (e) {
      this.error.set(errMsg(e));
      return null;
    } finally {
      this.busy.set(false);
    }
  }

  private build(
    d: DisputeDto,
    o: OrderLiteDto | undefined,
    l: Local,
    evidence: DisputeImage[],
  ): Dispute {
    const id = String(d.id);
    const s = (d.status ?? '').toLowerCase();
    const base: DisputeStatus =
      s === 'resolved' || s === 'closed' ? 'resolved' : s === 'in_progress' ? 'in_review' : 'open';
    const status: DisputeStatus = base !== 'resolved' && l.escalated ? 'escalated' : base;
    const openedAt = day16(d.createdAt);
    const raisedBy: 'buyer' | 'farmer' =
      o && d.raisedBy === o.buyerId ? 'buyer' : o ? 'farmer' : 'buyer';
    const issue = d.description?.trim() ? `${d.reason}. ${d.description.trim()}` : d.reason;
    const amount = Number(o?.subtotal ?? o?.total ?? 0);
    const refunded =
      (o?.paymentStatus ?? '').toLowerCase() === 'refunded' ||
      (o?.status ?? '').toLowerCase() === 'cancelled';
    const outcome: Outcome = l.outcome ?? (refunded ? 'refund_buyer' : 'pay_farmer');

    const notes: DisputeNote[] = [
      { id: `raised-${id}`, at: openedAt, from: raisedBy, internal: false, to: null, text: issue },
      ...l.notes,
    ].sort((a, b) => a.at.localeCompare(b.at));

    return {
      id,
      code: `DSP-${id.padStart(3, '0')}`,
      orderId: String(d.orderId),
      orderCode: o?.code ?? `Order #${d.orderId}`,
      buyerId: o ? String(o.buyerId) : '',
      farmerId: o?.items?.[0]?.sellerId != null ? String(o.items[0].sellerId) : '',
      raisedBy,
      buyer: { name: o?.buyerName ?? 'Buyer', phone: o?.buyerPhone ?? '', type: '' },
      farmer: { name: o?.sellerName ?? 'Seller', phone: o?.sellerPhone ?? '' },
      amountKes: amount,
      issue,
      category: guess(`${d.reason} ${d.description ?? ''}`),
      status,
      openedAt,
      slaDeadline: addHours(openedAt, SLA_HOURS),
      reviewer: l.reviewer ?? (status === 'open' ? null : 'Admin'),
      notes,
      evidence,
      resolution:
        status === 'resolved'
          ? {
              outcome,
              refundKes: outcome === 'refund_buyer' ? amount : 0,
              note: d.resolution ?? '',
              at: day16(d.updatedAt),
              by: 'Admin',
            }
          : null,
    };
  }

  private patchLocal(id: string, fn: (l: Local) => Local) {
    this.local.update((m) => ({ ...m, [id]: fn(m[id] ?? EMPTY) }));
    try {
      localStorage.setItem(KEY, JSON.stringify(this.local()));
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  }

  private read(): Record<string, Local> {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Local>;
    } catch {
      return {};
    }
  }
}
