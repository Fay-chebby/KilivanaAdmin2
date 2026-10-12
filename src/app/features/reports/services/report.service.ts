import { Injectable } from '@angular/core';
import { Observable, delay, map, of, take, tap, timer } from 'rxjs';
import {
  ChartPoint,
  DateRange,
  ExportFormat,
  ReportDefinition,
  ReportId,
  ReportsOverview,
} from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  // Inject your ApiService here when the backend is ready, e.g.
  // private api = inject(ApiService);

  readonly reports: ReportDefinition[] = [
    {
      id: 'sales',
      title: 'Sales report',
      description: 'Revenue by farmer, region and crop category',
      icon: '📊',
      tint: '#e0f2fe',
      route: '/reports/sales',
    },
    {
      id: 'inspectors',
      title: 'Inspector activity',
      description: 'Inspections completed, pass and fail rates',
      icon: '🔎',
      tint: '#ede9fe',
    },
    {
      id: 'payouts',
      title: 'Payout summary',
      description: 'Farmer and supplier payouts by period',
      icon: '💰',
      tint: '#fef3c7',
      route: '/reports/financial',
    },
    {
      id: 'crop-yield',
      title: 'Crop yield report',
      description: 'Yield volumes by crop type and region',
      icon: '🌿',
      tint: '#dcfce7',
      route: '/reports/products',
    },
    {
      id: 'buyers',
      title: 'Buyer behaviour',
      description: 'Order frequency, AOV and retention by buyer',
      icon: '🛒',
      tint: '#fce7f3',
      route: '/reports/orders',
    },
    {
      id: 'disputes',
      title: 'Dispute report',
      description: 'Dispute rates, resolution times and outcomes',
      icon: '⚖️',
      tint: '#ffedd5',
    },
  ];

  getOverview(range: DateRange): Observable<ReportsOverview> {
    // return this.api.get<ReportsOverview>('/reports/overview', { from: range.from, to: range.to });
    const { n, step } = this.bucket(range);
    const end = new Date(range.to);
    const labels = Array.from({ length: n }, (_, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (n - 1 - i) * step);
      return d.toLocaleDateString(
        'en',
        step >= 30 ? { month: 'short' } : { month: 'short', day: 'numeric' },
      );
    });
    const series = (base: number, growth: number, noise: number): ChartPoint[] =>
      labels.map((label, i) => ({
        label,
        value: Math.round(base * (1 + i * growth) + Math.sin(i * 1.7) * base * noise),
      }));

    const salesTrend = series(95_000, 0.11, 0.04);
    const orders = series(48, 0.1, 0.06);
    const revenue = salesTrend.reduce((s, p) => s + p.value, 0);
    const orderCount = orders.reduce((s, p) => s + p.value, 0);

    return of<ReportsOverview>({
      salesTrend,
      orders,
      kpis: [
        { label: 'Revenue', value: revenue, format: 'currency', change: 12.4 },
        { label: 'Orders', value: orderCount, format: 'number', change: 8.1 },
        {
          label: 'Average order value',
          value: revenue / Math.max(orderCount, 1),
          format: 'currency',
          change: 3.9,
        },
        { label: 'Dispute rate', value: 2.1, format: 'percent', change: -0.4, invertTrend: true },
      ],
    }).pipe(delay(450));
  }

  /** CSV is generated client-side. xlsx/pdf should come from the backend as a Blob. */
  export(id: ReportId | 'overview', format: ExportFormat, range: DateRange): Observable<void> {
    if (format !== 'csv') {
      // TODO: this.api.getBlob(`/reports/${id}/export`, { format, ...range }) then this.download(...)
      return timer(900).pipe(map(() => void 0));
    }
    return this.getOverview(range).pipe(
      take(1),
      tap((o) => {
        const rows = [
          'label,sales_ghs,orders',
          ...o.salesTrend.map((p, i) => `${p.label},${p.value},${o.orders[i]?.value ?? ''}`),
        ];
        this.download(
          `${id}-${range.from}-to-${range.to}.csv`,
          rows.join('\n'),
          'text/csv;charset=utf-8',
        );
      }),
      map(() => void 0),
    );
  }

  private bucket({ from, to }: DateRange) {
    const days = Math.max(1, Math.round((+new Date(to) - +new Date(from)) / 86_400_000));
    if (days <= 7) return { n: days, step: 1 };
    if (days <= 31) return { n: 10, step: 3 };
    if (days <= 100) return { n: 13, step: 7 };
    return { n: 12, step: 30 };
  }

  private download(name: string, content: string, mime: string) {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
