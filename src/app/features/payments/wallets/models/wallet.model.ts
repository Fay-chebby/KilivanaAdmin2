export type MetricKey =
  | 'totalFundsReceived'
  | 'platformRevenue'
  | 'sellerPayables'
  | 'availablePlatformFunds'
  | 'pendingPayouts'
  | 'completedPayouts'
  | 'pendingRefunds'
  | 'paymentProcessingFees';

/** Everything on the overview comes from the backend. The browser adds nothing up. */
export interface AdminWalletOverview {
  totalFundsReceived: number;
  platformRevenue: number;
  sellerPayables: number;
  availablePlatformFunds: number;
  pendingPayouts: number;
  completedPayouts: number;
  pendingRefunds: number;
  paymentProcessingFees: number;
  currency: string;
  lastUpdated: string;
  /** Percent change against the previous period. Only shown for metrics the backend sends. */
  comparison?: Partial<Record<MetricKey, number>>;
  breakdown?: AdminWalletBreakdown;
}

export interface AdminWalletBreakdown {
  totalSuccessfulPayments: number;
  fundsAwaitingSettlement: number;
  settledFunds: number;
  sellerPayableBalances: number;
  fundsReservedForPayouts: number;
  refundLiabilities: number;
  platformCommissionEarned: number;
  paymentProcessingExpenses: number;
  netPlatformRevenue: number;
}

export interface WalletChartPoint {
  date: string; // ISO date
  revenue: number;
  paymentVolume: number;
  payouts: number;
  refunds: number;
  inflows: number;
  outflows: number;
}
export type ChartSeries =
  | 'revenue'
  | 'paymentVolume'
  | 'payouts'
  | 'refunds'
  | 'inflows'
  | 'outflows';
export const CHART_SERIES: { key: ChartSeries; label: string; header: string }[] = [
  { key: 'revenue', label: 'Platform revenue', header: 'Revenue' },
  { key: 'paymentVolume', label: 'Buyer payments', header: 'Payments' },
  { key: 'payouts', label: 'Seller payouts', header: 'Payouts' },
  { key: 'refunds', label: 'Refunds', header: 'Refunds' },
  { key: 'inflows', label: 'Inflows', header: 'Inflows' },
  { key: 'outflows', label: 'Outflows', header: 'Outflows' },
];

export interface ReconciliationSummary {
  paymentsExpected: number;
  paymentsConfirmed: number;
  payoutsExpected: number;
  payoutsConfirmed: number;
  unmatchedPayments: number;
  unmatchedPayouts: number;
  discrepancies: number;
  lastReconciledAt?: string | null;
  status: string;
}

/** Spring Data page. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // zero based
  size: number;
}

/** Wallet money is shown to the cent, as KSh 125,000.00. */
export function kesExact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n < 0 ? '-' : ''}KSh ${Math.abs(n).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** One date style everywhere: 26 Nov 2026, 11:29 */
export function fmtDateTime(iso?: string | null): string {
  if (!iso) return 'Not available';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not available';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Never print "ORD-null" or an empty reference. */
export const refOrNA = (v?: string | null) =>
  v && v.trim() && !/null|undefined/i.test(v) ? v : 'Not available';

export class WalletApiError extends Error {
  constructor(
    message: string,
    readonly notAvailable = false,
  ) {
    super(message);
  }
}
