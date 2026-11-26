import { LedgerEntry } from './Ledger entry.model';

export type Direction = 'CREDIT' | 'DEBIT';

export interface WalletTransaction {
  id: string;
  reference: string;
  transactionType: string;
  amount: number;
  currency: string;
  direction: Direction;
  status: string;
  orderReference?: string | null;
  paymentReference?: string | null;
  providerReference?: string | null;
  sellerId?: string | null;
  sellerName?: string | null;
  accountId?: string | null;
  accountName?: string | null;
  sourceAccount?: string | null;
  destinationAccount?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  createdBy?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
  ledgerEntries?: LedgerEntry[];
}

export const TXN_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'BUYER_PAYMENT_RECEIVED', label: 'Buyer payment received' },
  { value: 'PLATFORM_COMMISSION_EARNED', label: 'Platform commission earned' },
  { value: 'SELLER_EARNINGS_ALLOCATED', label: 'Seller earnings allocated' },
  { value: 'SELLER_PAYOUT_RESERVED', label: 'Seller payout reserved' },
  { value: 'SELLER_PAYOUT_COMPLETED', label: 'Seller payout completed' },
  { value: 'BUYER_REFUND', label: 'Buyer refund' },
  { value: 'PAYMENT_PROCESSING_FEE', label: 'Payment processing fee' },
  { value: 'SETTLEMENT', label: 'Settlement' },
  { value: 'REVERSAL', label: 'Reversal' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
];

export const STATUS_OPTIONS = [
  'PENDING',
  'PROCESSING',
  'SUCCESSFUL',
  'FAILED',
  'CANCELLED',
  'REVERSED',
  'REFUNDED',
  'HELD',
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SUCCESSFUL: 'Successful',
  SUCCESS: 'Successful',
  COMPLETED: 'Successful',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REVERSED: 'Reversed',
  REFUNDED: 'Refunded',
  HELD: 'Held',
};
export type StatusTone = 'amber' | 'blue' | 'green' | 'red' | 'gray' | 'purple';
const STATUS_TONE: Record<string, StatusTone> = {
  PENDING: 'amber',
  PROCESSING: 'blue',
  SUCCESSFUL: 'green',
  SUCCESS: 'green',
  COMPLETED: 'green',
  FAILED: 'red',
  CANCELLED: 'gray',
  REVERSED: 'purple',
  REFUNDED: 'purple',
  HELD: 'amber',
};
const norm = (s: string) =>
  String(s ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
const title = (s: string) =>
  String(s)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

/** Backend value to a readable label. Unknown values are shown as sent, never hidden. */
export const statusLabel = (s: string) => STATUS_LABEL[norm(s)] ?? title(s || 'Unknown');
export const statusTone = (s: string): StatusTone => STATUS_TONE[norm(s)] ?? 'gray';
export const typeLabel = (t: string) =>
  TXN_TYPE_OPTIONS.find((o) => o.value === norm(t))?.label ?? title(t || 'Unknown');
