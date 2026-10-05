import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Order, subtotal } from '../../orders/models/order.model';
import { OrderService } from '../../orders/services/order.service';
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

const now = () => new Date().toISOString().slice(0, 16);
const ago = (h: number) => new Date(Date.now() - h * 36e5).toISOString().slice(0, 16);
const addHours = (iso: string, h: number) =>
  new Date(new Date(iso).getTime() + h * 36e5).toISOString().slice(0, 16);
const uid = () => crypto.randomUUID();

function snap(i: number): string {
  const c = ['#c8832b', '#c0432f', '#3b76b8'][i % 3];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='#f1ede6'/><path d='M60 210 Q200 90 340 210 L320 250 Q200 270 80 250Z' fill='${c}' opacity='.85'/><circle cx='160' cy='190' r='22' fill='#fff' opacity='.25'/><circle cx='240' cy='200' r='18' fill='#000' opacity='.18'/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const note = (
  at: string,
  from: DisputeNote['from'],
  text: string,
  o: Partial<DisputeNote> = {},
): DisputeNote => ({ id: uid(), at, from, internal: false, to: null, text, ...o });

/** Demo data for the orders that already have a dispute in the mock orders list */
const SEED: Record<
  string,
  {
    no: number;
    status: DisputeStatus;
    category: Category;
    reviewer: string | null;
    notes: () => DisputeNote[];
    evidence: () => DisputeImage[];
  }
> = {
  o9: {
    no: 39,
    status: 'escalated',
    category: 'not_received',
    reviewer: 'Admin',
    notes: () => [
      note(
        ago(100),
        'buyer',
        'I never received this order. Nobody came to my address in Lavington.',
      ),
      note(
        ago(98),
        'farmer',
        'The driver collected the potatoes from my farm on the day. I have the pickup message.',
      ),
      note(
        ago(76),
        'admin',
        'Called the driver. She says the delivery code was entered at the gate. Checking the GPS trail.',
        { internal: true },
      ),
      note(ago(52), 'system', 'Escalated by Admin: GPS trail and the buyer story do not match.'),
    ],
    evidence: () => [],
  },
  o8: {
    no: 40,
    status: 'in_review',
    category: 'quality',
    reviewer: 'Admin',
    notes: () => [
      note(ago(50), 'buyer', 'Our moisture meter reads 14.8%. The agreed level was 12%.'),
      note(
        ago(30),
        'admin',
        "Please send the lab slip so we can compare it with the farmer's own reading.",
        { to: 'buyer' },
      ),
      note(
        ago(26),
        'admin',
        'Asked the buyer for the lab slip. Waiting before contacting the farmer.',
        { internal: true },
      ),
    ],
    evidence: () => [
      { id: uid(), url: snap(0), caption: 'Moisture meter reading', by: 'buyer', at: ago(49) },
    ],
  },
  o3: {
    no: 41,
    status: 'open',
    category: 'damaged',
    reviewer: null,
    notes: () => [],
    evidence: () => [
      { id: uid(), url: snap(1), caption: 'Bruised tomatoes, crate 4', by: 'buyer', at: ago(5) },
      { id: uid(), url: snap(2), caption: 'Crates on arrival', by: 'buyer', at: ago(5) },
    ],
  },
};

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

/**
 * In-memory implementation. A dispute is created automatically for any order that is "Disputed",
 * and closes automatically if the order is settled from the Orders page.
 * Replace the bodies with HttpClient calls later and keep the method names.
 */
@Injectable({ providedIn: 'root' })
export class DisputeService {
  private readonly orders = inject(OrderService);
  private readonly _disputes = signal<Dispute[]>([]);

  readonly disputes = this._disputes.asReadonly();
  /** ticks every minute so deadlines on screen stay current */
  readonly clock = signal(Date.now());

  readonly stats = computed(() => {
    const l = this._disputes();
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
    this.sync(this.orders.orders());
    effect(() => {
      const list = this.orders.orders();
      untracked(() => this.sync(list));
    });
    const t = setInterval(() => this.clock.set(Date.now()), 60000);
    inject(DestroyRef).onDestroy(() => clearInterval(t));
  }

  get(id: string) {
    return this._disputes().find((d) => d.id === id);
  }
  byOrder(orderId: string) {
    return this.get(orderId);
  }

  // ---------- keep in step with orders ----------
  private sync(orders: Order[]) {
    const next = [...this._disputes()];
    let changed = false;
    for (const o of orders) {
      const i = next.findIndex((d) => d.id === o.id);
      if (o.status === 'disputed' && i < 0) {
        next.push(
          this.build(o, Math.max(41, ...next.map((d) => parseInt(d.code.slice(4), 10))) + 1),
        );
        changed = true;
      } else if (i >= 0 && next[i].status !== 'resolved' && o.status !== 'disputed') {
        const outcome: Outcome = o.status === 'cancelled' ? 'refund_buyer' : 'pay_farmer';
        next[i] = {
          ...next[i],
          status: 'resolved',
          resolution: {
            outcome,
            refundKes: outcome === 'refund_buyer' ? next[i].amountKes : 0,
            note: 'Settled from the Orders page.',
            at: now(),
            by: 'Admin',
          },
          notes: [...next[i].notes, note(now(), 'system', 'Settled from the Orders page.')],
        };
        changed = true;
      }
    }
    if (changed) this._disputes.set(next);
  }

  private build(o: Order, nextNo: number): Dispute {
    const seed = SEED[o.id];
    const opened =
      [...o.events].reverse().find((e) => e.text.startsWith('Dispute raised'))?.at ?? now();
    const issue = o.note || 'A dispute was raised on this order.';
    return {
      id: o.id,
      code: `DSP-${String(seed?.no ?? nextNo).padStart(3, '0')}`,
      orderId: o.id,
      orderCode: o.code,
      buyer: { name: o.buyer.name, phone: o.buyer.phone, type: o.buyer.type },
      farmer: { name: o.farmer.name, phone: o.farmer.phone },
      amountKes: subtotal(o),
      issue,
      category: seed?.category ?? guess(issue),
      status: seed?.status ?? 'open',
      openedAt: opened,
      slaDeadline: addHours(opened, SLA_HOURS),
      reviewer: seed?.reviewer ?? null,
      notes: seed?.notes() ?? [],
      evidence: seed?.evidence() ?? [],
      resolution: null,
    };
  }

  // ---------- actions ----------
  private patch(id: string, fn: (d: Dispute) => Dispute) {
    this._disputes.update((l) => l.map((d) => (d.id === id ? fn(d) : d)));
  }

  startReview(id: string) {
    this.patch(id, (d) => ({
      ...d,
      status: 'in_review',
      reviewer: 'Admin',
      notes: [...d.notes, note(now(), 'system', 'Admin started reviewing this dispute.')],
    }));
  }

  escalate(id: string, reason: string) {
    this.patch(id, (d) => ({
      ...d,
      status: 'escalated',
      reviewer: d.reviewer ?? 'Admin',
      notes: [...d.notes, note(now(), 'system', `Escalated by Admin: ${reason}`)],
    }));
  }

  post(id: string, text: string, mode: 'internal' | 'buyer' | 'farmer') {
    this.patch(id, (d) => ({
      ...d,
      notes: [
        ...d.notes,
        note(now(), 'admin', text, {
          internal: mode === 'internal',
          to: mode === 'internal' ? null : mode,
        }),
      ],
    }));
  }

  addEvidence(id: string, items: { url: string; name: string }[]) {
    const imgs: DisputeImage[] = items.map((i) => ({
      id: uid(),
      url: i.url,
      caption: i.name,
      by: 'admin',
      at: now(),
    }));
    this.patch(id, (d) => ({ ...d, evidence: [...d.evidence, ...imgs] }));
  }
  removeEvidence(id: string, imageId: string) {
    this.patch(id, (d) => ({ ...d, evidence: d.evidence.filter((e) => e.id !== imageId) }));
  }

  /** Closes the dispute and settles the order's payment */
  resolve(id: string, outcome: Outcome, noteText: string, refundKes: number) {
    const d = this.get(id);
    if (!d) return;
    const refund =
      outcome === 'refund_buyer'
        ? d.amountKes
        : outcome === 'partial_refund'
          ? refund0(refundKes, d.amountKes)
          : 0;
    this.patch(id, (x) => ({
      ...x,
      status: 'resolved',
      reviewer: x.reviewer ?? 'Admin',
      resolution: { outcome, refundKes: refund, note: noteText, at: now(), by: 'Admin' },
      notes: [
        ...x.notes,
        note(
          now(),
          'system',
          `Resolved: ${outcome === 'refund_buyer' ? 'buyer refunded in full' : outcome === 'pay_farmer' ? 'farmer paid in full' : 'partial refund'}. ${noteText}`,
        ),
      ],
    }));
    this.orders.resolveDispute(
      d.orderId,
      outcome === 'refund_buyer' ? 'buyer' : 'farmer',
      noteText,
      outcome === 'partial_refund' ? refund : 0,
    );
  }
}

const refund0 = (v: number, max: number) => Math.min(Math.max(Math.round(v), 0), max);
