import { PLATFORM_FEE_RATE } from '../../orders/models/order.model';

export { PLATFORM_FEE_RATE };

export type TxnType = 'payment' | 'payout' | 'refund';
export type TxnStatus = 'settled' | 'pending' | 'failed';

// ---------- Backend contract (/api/v1/payments, /api/v1/admin/payments) ----------
export type ApiPaymentStatus = 'pending' | 'paid' | 'held' | 'settled' | 'failed' | 'refunded';
export interface PaymentResponse {
  id: number;
  orderId: number;
  method: 'mpesa' | 'bank' | 'card';
  reference?: string;
  amount: number;
  status: ApiPaymentStatus;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export type PaymentTab = 'all' | 'payout' | 'refund';

/** What the farmer receives for a payment: the amount minus the platform fee (the rate comes from the order model). */
export const payoutOf = (paymentAmount: number) =>
  paymentAmount - Math.round(paymentAmount * PLATFORM_FEE_RATE);

export interface Transaction {
  id: string; // TXN-9901
  type: TxnType;
  party: string; // buyer for payments and refunds, farmer for payouts
  reference: string; // order id, e.g. ORD-2851
  amount: number; // KSh, always positive
  fee: number; // KSh, only on payments
  net: number; // KSh, signed: refunds are negative
  status: TxnStatus;
  createdAt: string; // ISO date
  settledAt?: string;
  method: 'M-Pesa' | 'Bank transfer' | 'Card';
  externalRef?: string; // M-Pesa code (10 letters and numbers) or bank reference
  paymentId: number; // backend payment this row comes from
  rawStatus: ApiPaymentStatus;
}

export interface MonthlyPoint {
  label: string; // "Oct"
  longLabel: string; // "October"
  gross: number; // gross order volume, KSh
  revenue: number; // platform revenue = fees, KSh
}

export interface PayResult {
  ok: boolean;
  message: string;
}

export const TXN_TYPE_LABEL: Record<TxnType, string> = {
  payment: 'Payment',
  payout: 'Payout',
  refund: 'Refund',
};
export const TXN_STATUS_LABEL: Record<TxnStatus, string> = {
  settled: 'Settled',
  pending: 'Pending',
  failed: 'Failed',
};

export const PAYMENT_TABS: { key: PaymentTab; label: string }[] = [
  { key: 'all', label: 'Transactions' },
  { key: 'payout', label: 'Payouts' },
  { key: 'refund', label: 'Refunds' },
];

/** KSh 14,400 or -KSh 1,200 */
export function kes(n: number): string {
  return `${n < 0 ? '-' : ''}KSh ${Math.abs(n).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

/** KSh 2.84M, KSh 85.2k, KSh 900 */
export function compactKes(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1_000_000) return `${sign}KSh ${(a / 1_000_000).toFixed(2)}M`;
  if (a >= 1_000) return `${sign}KSh ${(a / 1_000).toFixed(1)}k`;
  return `${sign}KSh ${a}`;
}

export const isPending = (t: Transaction) => t.status === 'pending';
/** Payments settle on their own. Payouts and refunds are settled by an admin. */
export const canSettle = (t: Transaction) => t.status === 'pending' && t.type !== 'payment';

/** A buyer payment that has been received can be refunded. */
export const canRefund = (t: Transaction) =>
  t.type === 'payment' && ['paid', 'held', 'settled'].includes(t.rawStatus);
