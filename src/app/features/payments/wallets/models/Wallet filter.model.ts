export type DateRangeKey = 'today' | '7d' | '30d' | '90d' | 'year' | 'custom';

export const DATE_RANGES: { key: DateRangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'year', label: 'This year' },
  { key: 'custom', label: 'Custom range' },
];

export interface DateRange {
  from: string;
  to: string;
} // yyyy-MM-dd

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function resolveRange(
  key: DateRangeKey,
  custom?: Partial<DateRange>,
  now = new Date(),
): DateRange | null {
  const to = ymd(now);
  const back = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return ymd(d);
  };
  switch (key) {
    case 'today':
      return { from: to, to };
    case '7d':
      return { from: back(6), to };
    case '30d':
      return { from: back(29), to };
    case '90d':
      return { from: back(89), to };
    case 'year':
      return { from: `${now.getFullYear()}-01-01`, to };
    case 'custom':
      return custom?.from && custom?.to && custom.from <= custom.to
        ? { from: custom.from, to: custom.to }
        : null;
  }
}

export type SortDir = 'asc' | 'desc';

export interface WalletFilter {
  q: string;
  type: string;
  status: string;
  accountId: string;
  from: string;
  to: string;
  minAmount: number | null;
  maxAmount: number | null;
  orderReference: string;
  reference: string;
  sellerId: string;
  direction: '' | 'DEBIT' | 'CREDIT';
  page: number; // zero based
  size: number;
  sort: string; // field name
  dir: SortDir;
}

export const EMPTY_FILTER: WalletFilter = {
  q: '',
  type: '',
  status: '',
  accountId: '',
  from: '',
  to: '',
  minAmount: null,
  maxAmount: null,
  orderReference: '',
  reference: '',
  sellerId: '',
  direction: '',
  page: 0,
  size: 20,
  sort: 'createdAt',
  dir: 'desc',
};

/** Only filled fields go on the URL. */
export function toQuery(f: Partial<WalletFilter>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  const set = (k: string, v: string | number | null | undefined) => {
    if (v !== '' && v != null) out[k] = v;
  };
  set('q', f.q?.trim());
  set('type', f.type);
  set('status', f.status);
  set('accountId', f.accountId);
  set('from', f.from);
  set('to', f.to);
  set('minAmount', f.minAmount);
  set('maxAmount', f.maxAmount);
  set('orderReference', f.orderReference?.trim());
  set('reference', f.reference?.trim());
  set('sellerId', f.sellerId?.trim());
  set('direction', f.direction);
  set('page', f.page);
  set('size', f.size);
  if (f.sort) out['sort'] = `${f.sort},${f.dir ?? 'desc'}`;
  return out;
}

/** True when the amount range is the wrong way round. */
export const badAmountRange = (f: Pick<WalletFilter, 'minAmount' | 'maxAmount'>) =>
  f.minAmount != null && f.maxAmount != null && f.minAmount > f.maxAmount;
