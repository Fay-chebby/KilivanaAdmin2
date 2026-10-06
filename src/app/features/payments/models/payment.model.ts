export type TxnType = 'payment' | 'payout' | 'refund';
export type TxnStatus = 'settled' | 'pending';
export type PaymentTab = 'all' | 'payout' | 'refund';

/** Platform fee taken from each buyer payment. Payouts go to farmers after this fee. */
export const PLATFORM_FEE_RATE = 0.03;

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
