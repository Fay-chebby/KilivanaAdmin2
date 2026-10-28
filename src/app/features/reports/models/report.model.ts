export type RangePreset = '7d' | '30d' | '90d' | '12m' | 'custom';
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';
export type ReportId = 'sales' | 'inspectors' | 'payouts' | 'crop-yield' | 'buyers' | 'disputes';

export interface DateRange {
  preset: RangePreset;
  from: string; // yyyy-mm-dd
  to: string;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface Kpi {
  label: string;
  value: number;
  format: 'currency' | 'number' | 'percent';
  /** % change vs previous period, or null when there is no previous data. */
  change: number | null;
  /** For KPIs where a drop is good (e.g. disputes). */
  invertTrend?: boolean;
}

export interface ReportsOverview {
  kpis: Kpi[];
  salesTrend: ChartPoint[];
  orders: ChartPoint[];
}

export interface ReportDefinition {
  id: ReportId;
  title: string;
  description: string;
  icon: string;
  tint: string;
  /** Route to the detailed report page. Leave undefined until the page exists. */
  route?: string;
  /** False when the backend has no data source for this report yet. */
  exportable: boolean;
}

export const RANGE_PRESETS: { value: RangePreset; label: string; days: number }[] = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
  { value: '12m', label: 'Last 12 months', days: 365 },
  { value: 'custom', label: 'Custom range', days: 30 },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function rangeFromPreset(preset: RangePreset): DateRange {
  const days = RANGE_PRESETS.find((p) => p.value === preset)?.days ?? 30;
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days);
  return { preset, from: iso(from), to: iso(to) };
}
