import { Injectable, computed, signal } from '@angular/core';
import {
  MonthlyPoint,
  PLATFORM_FEE_RATE,
  PayResult,
  TXN_TYPE_LABEL,
  Transaction,
  TxnType,
  canSettle,
  kes,
  payoutOf,
} from '../models/payment.model';

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

function txn(
  n: number,
  type: TxnType,
  party: string,
  reference: string,
  amount: number,
  status: 'settled' | 'pending',
  days: number,
  method: Transaction['method'],
  externalRef?: string,
): Transaction {
  const fee = type === 'payment' ? Math.round(amount * PLATFORM_FEE_RATE) : 0;
  const net = type === 'payment' ? amount - fee : type === 'refund' ? -amount : amount;
  return {
    id: `TXN-${n}`,
    type,
    party,
    reference,
    amount,
    fee,
    net,
    status,
    method,
    externalRef,
    createdAt: daysAgo(days),
    settledAt: status === 'settled' ? daysAgo(days) : undefined,
  };
}

// Newest first. Replace with your API. A payout is the matching payment minus the platform fee.
const SEED: Transaction[] = [
  txn(
    9901,
    'payment',
    'Nairobi Fresh Mart Ltd',
    'ORD-2851',
    142_000,
    'settled',
    0,
    'M-Pesa',
    'SJK4L2M9QX',
  ),
  txn(9900, 'payout', 'Mary Wanjiku', 'ORD-2847', 91_600, 'settled', 0, 'M-Pesa', 'SJK4L1A7PD'),
  txn(
    9899,
    'payment',
    'Mombasa Grocers Co.',
    'ORD-2850',
    85_000,
    'settled',
    0,
    'Bank transfer',
    'KCB-88213307',
  ),
  txn(9898, 'refund', 'John Mwangi', 'ORD-2849', 12_000, 'pending', 1, 'M-Pesa'),
  txn(9897, 'payout', 'Peter Kamau', 'ORD-2848', 26_880, 'settled', 1, 'M-Pesa', 'SJJ9T5N2WE'),
  txn(
    9896,
    'payment',
    'Kisumu Foods Ltd',
    'ORD-2846',
    64_500,
    'settled',
    2,
    'M-Pesa',
    'SJI2B8C4RZ',
  ),
  txn(9895, 'payout', 'Grace Achieng', 'ORD-2846', payoutOf(64_500), 'pending', 2, 'M-Pesa'),
  txn(9894, 'payment', 'Eldoret Wholesale', 'ORD-2845', 118_200, 'settled', 3, 'Card', 'CH-5521'),
  txn(9893, 'payout', 'Samuel Kiprop', 'ORD-2845', payoutOf(118_200), 'pending', 3, 'M-Pesa'),
  txn(9892, 'refund', 'Fatuma Hassan', 'ORD-2844', 4_800, 'settled', 4, 'M-Pesa', 'SJG7Q3V8LM'),
  txn(
    9891,
    'payment',
    'FreshPak Exports',
    'ORD-2843',
    203_000,
    'settled',
    5,
    'Bank transfer',
    'EQB-70419982',
  ),
  txn(9890, 'payout', 'Rift Valley Growers', 'ORD-2843', payoutOf(203_000), 'pending', 5, 'M-Pesa'),
  txn(
    9889,
    'payment',
    'Naivasha Greens Market',
    'ORD-2842',
    38_400,
    'settled',
    6,
    'M-Pesa',
    'SJF1X6D0KT',
  ),
  txn(
    9888,
    'payout',
    'Lucy Njeri',
    'ORD-2842',
    payoutOf(38_400),
    'settled',
    6,
    'M-Pesa',
    'SJF2Y9H3UC',
  ),
  txn(9887, 'payment', 'Thika Retailers', 'ORD-2841', 71_300, 'settled', 8, 'M-Pesa', 'SJD5M7P1AB'),
  txn(
    9886,
    'payout',
    'David Otieno',
    'ORD-2841',
    payoutOf(71_300),
    'settled',
    8,
    'M-Pesa',
    'SJD6N2R8GH',
  ),
  txn(9885, 'refund', 'Brian Mutua', 'ORD-2840', 7_500, 'pending', 9, 'M-Pesa'),
  txn(
    9884,
    'payment',
    'Nakuru Hotel Supplies',
    'ORD-2839',
    56_000,
    'settled',
    10,
    'Bank transfer',
    'NCBA-33920415',
  ),
];

// Gross order volume for the last 7 months, oldest first. Revenue is the platform fee on it.
const GROSS_SERIES = [1_050_000, 1_290_000, 1_540_000, 1_820_000, 2_010_000, 2_390_000, 2_840_000];

function buildMonthly(): MonthlyPoint[] {
  const now = new Date();
  return GROSS_SERIES.map((gross, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (GROSS_SERIES.length - 1 - i), 1);
    return {
      label: d.toLocaleString('en-US', { month: 'short' }),
      longLabel: d.toLocaleString('en-US', { month: 'long' }),
      gross,
      revenue: Math.round(gross * PLATFORM_FEE_RATE),
    };
  });
}

const pct = (cur: number, prev: number) =>
  prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : 0;
const sum = (l: Transaction[]) => l.reduce((s, t) => s + t.amount, 0);

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private _txns = signal<Transaction[]>(SEED);

  readonly transactions = this._txns.asReadonly();
  readonly monthly = buildMonthly();

  /** Month figures come from the monthly series. Pending payouts and open refunds come from the transactions. */
  readonly stats = computed(() => {
    const cur = this.monthly[this.monthly.length - 1];
    const prev = this.monthly[this.monthly.length - 2];
    const payouts = this._txns().filter((t) => t.type === 'payout' && t.status === 'pending');
    const refunds = this._txns().filter((t) => t.type === 'refund' && t.status === 'pending');
    return {
      monthLabel: cur.label,
      revenue: cur.revenue,
      revenueDelta: pct(cur.revenue, prev.revenue),
      gross: cur.gross,
      grossDelta: pct(cur.gross, prev.gross),
      pendingPayouts: sum(payouts),
      pendingPayoutCount: payouts.length,
      openRefunds: sum(refunds),
      openRefundCount: refunds.length,
    };
  });

  get(id: string) {
    return this._txns().find((t) => t.id === id);
  }

  /** Settle one pending payout or refund. */
  settle(id: string): PayResult {
    const t = this.get(id);
    if (!t) return fail('Transaction not found.');
    if (t.status === 'settled') return fail(`${t.id} is already settled.`);
    if (!canSettle(t)) return fail('Payments settle automatically.');
    this.patch(id, (x) => ({ ...x, status: 'settled', settledAt: new Date().toISOString() }));
    // TODO real API: payouts call the M-Pesa B2C API, refunds call the reversal API. Only mark settled after the provider confirms.
    return {
      ok: true,
      message: `${TXN_TYPE_LABEL[t.type]} of ${kes(t.amount)} to ${t.party} was settled.`,
    };
  }

  /** Pay every pending payout in one go. */
  runPayoutBatch(): PayResult {
    const pending = this._txns().filter((t) => t.type === 'payout' && t.status === 'pending');
    if (!pending.length) return fail('There are no pending payouts to run.');
    const ids = new Set(pending.map((t) => t.id));
    const at = new Date().toISOString();
    this._txns.update((l) =>
      l.map((t) => (ids.has(t.id) ? { ...t, status: 'settled', settledAt: at } : t)),
    );
    return {
      ok: true,
      message: `Paid ${pending.length} payout${pending.length === 1 ? '' : 's'} totalling ${kes(sum(pending))}.`,
    };
  }

  private patch(id: string, fn: (t: Transaction) => Transaction) {
    this._txns.update((l) => l.map((t) => (t.id === id ? fn(t) : t)));
  }
}

const fail = (message: string): PayResult => ({ ok: false, message });
