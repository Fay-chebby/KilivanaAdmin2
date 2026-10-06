import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

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

const ago = (hours: number) => new Date(Date.now() - hours * 36e5).toISOString().slice(0, 16);

const addHours = (iso: string, hours: number) =>
  new Date(new Date(iso).getTime() + hours * 36e5).toISOString().slice(0, 16);

const uid = () => crypto.randomUUID();

function snap(index: number): string {
  const colors = ['#c8832b', '#c0432f', '#3b76b8'];
  const color = colors[index % 3];

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 300"
    >
      <rect
        width="400"
        height="300"
        fill="#f1ede6"
      />

      <path
        d="M60 210 Q200 90 340 210
           L320 250 Q200 270 80 250Z"
        fill="${color}"
        opacity=".85"
      />

      <circle
        cx="160"
        cy="190"
        r="22"
        fill="#fff"
        opacity=".25"
      />

      <circle
        cx="240"
        cy="200"
        r="18"
        fill="#000"
        opacity=".18"
      />
    </svg>
  `;

  return 'data:image/svg+xml;utf8=' + encodeURIComponent(svg);
}

const note = (
  at: string,
  from: DisputeNote['from'],
  text: string,
  options: Partial<DisputeNote> = {},
): DisputeNote => ({
  id: uid(),
  at,
  from,
  internal: false,
  to: null,
  text,
  ...options,
});

/**
 * Temporary demo disputes.
 *
 * These are standalone mock records.
 * They are NOT automatically generated from Order.status
 * because the real Order API does not have a "disputed" status.
 */
const DEMO_DISPUTES: Dispute[] = [
  {
    id: 39,
    code: 'DSP-039',
    orderId: 39,
    orderCode: 'ORD-0039',

    buyer: {
      name: 'Demo Buyer',
      phone: '+254700000001',
      type: 'Buyer',
    },

    farmer: {
      name: 'Demo Farmer',
      phone: '+254700000002',
    },

    amountKes: 12500,

    issue: 'The buyer reported that the order was not received.',

    category: 'not_received',

    status: 'escalated',

    openedAt: ago(100),

    slaDeadline: addHours(ago(100), SLA_HOURS),

    reviewer: 'Admin',

    notes: [
      note(ago(100), 'buyer', 'I never received this order.'),

      note(ago(98), 'farmer', 'The goods were handed over for delivery.'),

      note(ago(76), 'admin', 'Checking the delivery information.', {
        internal: true,
      }),

      note(ago(52), 'system', 'Escalated by Admin.'),
    ],

    evidence: [],
    resolution: null,
  },

  {
    id: 40,
    code: 'DSP-040',
    orderId: 40,
    orderCode: 'ORD-0040',

    buyer: {
      name: 'Demo Buyer',
      phone: '+254700000003',
      type: 'Buyer',
    },

    farmer: {
      name: 'Demo Farmer',
      phone: '+254700000004',
    },

    amountKes: 18000,

    issue: 'The buyer reported a quality issue with the delivered goods.',

    category: 'quality',

    status: 'in_review',

    openedAt: ago(50),

    slaDeadline: addHours(ago(50), SLA_HOURS),

    reviewer: 'Admin',

    notes: [
      note(ago(50), 'buyer', 'The quality does not match what was agreed.'),

      note(ago(30), 'admin', 'Please provide supporting evidence.', {
        to: 'buyer',
      }),
    ],

    evidence: [
      {
        id: uid(),
        url: snap(0),
        caption: 'Quality evidence',
        by: 'buyer',
        at: ago(49),
      },
    ],

    resolution: null,
  },

  {
    id: 41,
    code: 'DSP-041',
    orderId: 41,
    orderCode: 'ORD-0041',

    buyer: {
      name: 'Demo Buyer',
      phone: '+254700000005',
      type: 'Buyer',
    },

    farmer: {
      name: 'Demo Farmer',
      phone: '+254700000006',
    },

    amountKes: 9500,

    issue: 'The buyer reported damaged goods on arrival.',

    category: 'damaged',

    status: 'open',

    openedAt: ago(5),

    slaDeadline: addHours(ago(5), SLA_HOURS),

    reviewer: null,

    notes: [],

    evidence: [
      {
        id: uid(),
        url: snap(1),
        caption: 'Damaged goods',
        by: 'buyer',
        at: ago(5),
      },

      {
        id: uid(),
        url: snap(2),
        caption: 'Goods on arrival',
        by: 'buyer',
        at: ago(5),
      },
    ],

    resolution: null,
  },
];

@Injectable({
  providedIn: 'root',
})
export class DisputeService {
  private readonly _disputes = signal<Dispute[]>(DEMO_DISPUTES);

  readonly disputes = this._disputes.asReadonly();

  /**
   * Updates every minute so SLA information
   * displayed in the UI stays current.
   */
  readonly clock = signal(Date.now());

  readonly stats = computed(() => {
    const list = this._disputes();

    const open = list.filter((d) => d.status !== 'resolved');

    return {
      open: list.filter((d) => d.status === 'open').length,

      inReview: list.filter((d) => d.status === 'in_review').length,

      escalated: list.filter((d) => d.status === 'escalated').length,

      resolved: list.filter((d) => d.status === 'resolved').length,

      atStake: open.reduce((total, dispute) => total + dispute.amountKes, 0),

      overdue: open.filter((dispute) => slaInfo(dispute, this.clock()).state === 'overdue').length,
    };
  });

  constructor() {
    const timer = setInterval(() => this.clock.set(Date.now()), 60_000);

    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  get(id: number): Dispute | undefined {
    return this._disputes().find((d) => d.id === id);
  }

  byOrder(orderId: number): Dispute | undefined {
    return this._disputes().find((d) => d.orderId === orderId);
  }

  private patch(id: number, fn: (dispute: Dispute) => Dispute): void {
    this._disputes.update((list) =>
      list.map((dispute) => (dispute.id === id ? fn(dispute) : dispute)),
    );
  }

  startReview(id: number): void {
    this.patch(id, (dispute) => ({
      ...dispute,

      status: 'in_review',

      reviewer: dispute.reviewer ?? 'Admin',

      notes: [...dispute.notes, note(now(), 'system', 'Admin started reviewing this dispute.')],
    }));
  }

  escalate(id: number, reason: string): void {
    this.patch(id, (dispute) => ({
      ...dispute,

      status: 'escalated',

      reviewer: dispute.reviewer ?? 'Admin',

      notes: [...dispute.notes, note(now(), 'system', `Escalated by Admin: ${reason}`)],
    }));
  }

  post(id: number, text: string, mode: 'internal' | 'buyer' | 'farmer'): void {
    this.patch(id, (dispute) => ({
      ...dispute,

      notes: [
        ...dispute.notes,

        note(now(), 'admin', text, {
          internal: mode === 'internal',

          to: mode === 'internal' ? null : mode,
        }),
      ],
    }));
  }

  addEvidence(
    id: number,
    items: {
      url: string;
      name: string;
    }[],
  ): void {
    const images: DisputeImage[] = items.map((item) => ({
      id: uid(),
      url: item.url,
      caption: item.name,
      by: 'admin',
      at: now(),
    }));

    this.patch(id, (dispute) => ({
      ...dispute,

      evidence: [...dispute.evidence, ...images],
    }));
  }

  removeEvidence(id: number, imageId: string): void {
    this.patch(id, (dispute) => ({
      ...dispute,

      evidence: dispute.evidence.filter((image) => image.id !== imageId),
    }));
  }

  resolve(id: number, outcome: Outcome, noteText: string, refundKes: number): void {
    const dispute = this.get(id);

    if (!dispute) {
      return;
    }

    const refund =
      outcome === 'refund_buyer'
        ? dispute.amountKes
        : outcome === 'partial_refund'
          ? this.refundAmount(refundKes, dispute.amountKes)
          : 0;

    this.patch(id, (current) => ({
      ...current,

      status: 'resolved',

      reviewer: current.reviewer ?? 'Admin',

      resolution: {
        outcome,
        refundKes: refund,
        note: noteText,
        at: now(),
        by: 'Admin',
      },

      notes: [
        ...current.notes,

        note(
          now(),
          'system',
          `Resolved: ${
            outcome === 'refund_buyer'
              ? 'buyer refunded in full'
              : outcome === 'pay_farmer'
                ? 'farmer paid in full'
                : 'partial refund'
          }. ${noteText}`,
        ),
      ],
    }));

    /*
     * IMPORTANT:
     *
     * We intentionally do NOT call:
     *
     * this.orders.resolveDispute(...)
     *
     * because OrderService does not have that method
     * and your Orders API has not yet provided a
     * dispute-resolution endpoint.
     *
     * Once you provide the Disputes Swagger endpoints,
     * this method can make the real HTTP request.
     */
  }

  private refundAmount(value: number, maximum: number): number {
    return Math.min(Math.max(Math.round(value), 0), maximum);
  }
}
