import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap, throwError } from 'rxjs';

import {
  ChartPoint,
  DateRange,
  ExportFormat,
  Kpi,
  ReportDefinition,
  ReportId,
  ReportsOverview,
} from '../models/report.model';

import { API_BASE } from '../../../core/config/api.config';

const HEADERS = new HttpHeaders({
  'ngrok-skip-browser-warning': 'true',
});

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface ApiKpis {
  revenue: number;
  orders: number;
  averageOrderValue: number;
  disputeRate: number;
  previous?: ApiKpis | null;
}

interface ApiPoint {
  date: string;
  value: number;
}

interface ApiOverview {
  kpis: ApiKpis;
  salesTrend: ApiPoint[];
  orders: ApiPoint[];
}

interface ApiDisputeReport {
  total: number;
  open: number;
  resolved: number;
  avgResolutionHours: number;
  outcomes: Record<string, number>;
}

export interface ReportTable {
  columns: string[];
  rows: (string | number)[][];
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);

  readonly reports: ReportDefinition[] = [
    {
      id: 'sales',
      title: 'Sales report',
      description: 'Revenue by farmer, region and crop category',
      icon: '📊',
      tint: '#e0f2fe',
      route: '/reports/sales',
      exportable: true,
    },
    {
      id: 'inspectors',
      title: 'Inspector activity',
      description: 'Inspections completed, pass and fail rates',
      icon: '🔎',
      tint: '#ede9fe',
      exportable: true,
    },
    {
      id: 'payouts',
      title: 'Payout summary',
      description: 'Farmer and supplier payouts by period',
      icon: '💰',
      tint: '#fef3c7',
      route: '/reports/financial',
      exportable: false,
    },
    {
      id: 'crop-yield',
      title: 'Crop yield report',
      description: 'Yield volumes by crop type and region',
      icon: '🌿',
      tint: '#dcfce7',
      route: '/reports/products',
      exportable: true,
    },
    {
      id: 'buyers',
      title: 'Buyer behaviour',
      description: 'Order frequency, AOV and retention by buyer',
      icon: '🛒',
      tint: '#fce7f3',
      route: '/reports/orders',
      exportable: true,
    },
    {
      id: 'disputes',
      title: 'Dispute report',
      description: 'Dispute rates, resolution times and outcomes',
      icon: '⚖️',
      tint: '#ffedd5',
      exportable: true,
    },
  ];

  // ---------- HTTP helpers ----------

  private dateParams(range: DateRange): HttpParams {
    return new HttpParams().set('from', range.from).set('to', range.to);
  }

  private get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http
      .get<Envelope<T>>(`${API_BASE}${path}`, {
        headers: HEADERS,
        ...(params ? { params } : {}),
      })
      .pipe(map((response) => response.data));
  }

  // ---------- Overview ----------

  getOverview(range: DateRange): Observable<ReportsOverview> {
    return this.get<ApiOverview>('/admin/reports/overview', this.dateParams(range)).pipe(
      map((overview) => this.toOverview(overview)),
    );
  }

  private toOverview(o: ApiOverview): ReportsOverview {
    const k = o.kpis;
    const previous = k.previous ?? null;

    const kpis: Kpi[] = [
      {
        label: 'Revenue',
        value: k.revenue,
        format: 'currency',
        change: this.change(k.revenue, previous?.revenue),
      },
      {
        label: 'Orders',
        value: k.orders,
        format: 'number',
        change: this.change(k.orders, previous?.orders),
      },
      {
        label: 'Average order value',
        value: k.averageOrderValue,
        format: 'currency',
        change: this.change(k.averageOrderValue, previous?.averageOrderValue),
      },
      {
        label: 'Dispute rate',
        value: k.disputeRate,
        format: 'percent',
        change: this.change(k.disputeRate, previous?.disputeRate),
        invertTrend: true,
      },
    ];

    return {
      kpis,
      salesTrend: this.toPoints(o.salesTrend),
      orders: this.toPoints(o.orders),
    };
  }

  private change(current: number, previous?: number | null): number | null {
    if (previous == null || previous === 0) {
      return null;
    }

    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  private toPoints(points: ApiPoint[] = []): ChartPoint[] {
    const gap =
      points.length > 1
        ? (new Date(points[1].date).getTime() - new Date(points[0].date).getTime()) / 86_400_000
        : 1;

    const options: Intl.DateTimeFormatOptions =
      gap >= 28 ? { month: 'short' } : { month: 'short', day: 'numeric' };

    return points.map((point) => ({
      label: new Date(point.date + 'T00:00:00').toLocaleDateString('en', options),
      value: point.value,
    }));
  }

  // ---------- View a report ----------

  getReport(id: ReportId | 'overview', range: DateRange): Observable<ReportTable> {
    return this.rowsFor(id, range).pipe(
      map((data) => ({
        columns: (data[0] ?? []).map(String),
        rows: data.slice(1),
      })),
    );
  }

  // ---------- Download a report ----------

  export(id: ReportId | 'overview', format: ExportFormat, range: DateRange): Observable<void> {
    if (format !== 'csv') {
      return throwError(
        () =>
          new Error(
            'Excel and PDF downloads require a backend export endpoint or an additional export library. CSV is available now.',
          ),
      );
    }

    return this.rowsFor(id, range).pipe(
      tap((rows) => {
        this.download(`${id}-${range.from}-to-${range.to}.csv`, rows);
      }),
      map(() => void 0),
    );
  }

  // ---------- Report data sources ----------

  private rowsFor(id: ReportId | 'overview', range: DateRange): Observable<(string | number)[][]> {
    const params = this.dateParams(range);

    switch (id) {
      case 'overview':
      case 'sales':
        return this.get<ApiOverview>('/admin/reports/overview', params).pipe(
          map((overview) => [
            ['date', 'sales_kes', 'orders'],
            ...overview.salesTrend.map((sale, index) => [
              sale.date,
              sale.value,
              overview.orders[index]?.value ?? 0,
            ]),
          ]),
        );

      case 'disputes':
        return this.get<ApiDisputeReport>('/admin/reports/disputes', params).pipe(
          map((disputes) => [
            ['metric', 'value'],
            ['total', disputes.total],
            ['open', disputes.open],
            ['resolved', disputes.resolved],
            ['avg_resolution_hours', disputes.avgResolutionHours],
            ...Object.entries(disputes.outcomes ?? {}).map(([key, value]) => [
              `outcome_${key.toLowerCase()}`,
              value,
            ]),
          ]),
        );

      case 'crop-yield':
        return this.get<
          {
            name: string;
            farmCount: number;
            totalAreaAcres: number;
            expectedYieldKg: number;
          }[]
        >('/admin/crops/summary').pipe(
          map((crops) => [
            ['crop', 'farms', 'area_acres', 'expected_yield_kg'],
            ...crops.map((crop) => [
              crop.name,
              crop.farmCount,
              crop.totalAreaAcres,
              crop.expectedYieldKg,
            ]),
          ]),
        );

      case 'buyers':
        return this.get<
          {
            code: string;
            fullName: string;
            email: string;
            phone: string;
            region: string;
            ordersCount: number;
            totalSpend: number;
            disputesCount: number;
          }[]
        >('/admin/buyers').pipe(
          map((buyers) => [
            ['code', 'name', 'email', 'phone', 'region', 'orders', 'total_spend_kes', 'disputes'],
            ...buyers.map((buyer) => [
              buyer.code,
              buyer.fullName,
              buyer.email,
              buyer.phone,
              buyer.region,
              buyer.ordersCount,
              buyer.totalSpend,
              buyer.disputesCount,
            ]),
          ]),
        );

      case 'inspectors':
        return this.get<
          {
            inspectorId: number;
            status: string;
            result?: string;
          }[]
        >('/admin/inspections', new HttpParams().set('page', 0).set('size', 1000)).pipe(
          map((inspections) => {
            const totals = new Map<
              number,
              {
                completed: number;
                approved: number;
                rejected: number;
                changesRequired: number;
              }
            >();

            for (const inspection of inspections) {
              const stats = totals.get(inspection.inspectorId) ?? {
                completed: 0,
                approved: 0,
                rejected: 0,
                changesRequired: 0,
              };

              if (inspection.status === 'COMPLETED') {
                stats.completed++;
              }

              if (inspection.result === 'APPROVED') {
                stats.approved++;
              }

              if (inspection.result === 'REJECTED') {
                stats.rejected++;
              }

              if (inspection.result === 'CHANGES_REQUIRED') {
                stats.changesRequired++;
              }

              totals.set(inspection.inspectorId, stats);
            }

            return [
              ['inspector_id', 'completed', 'approved', 'rejected', 'changes_required'],
              ...[...totals].map(([inspectorId, stats]) => [
                inspectorId,
                stats.completed,
                stats.approved,
                stats.rejected,
                stats.changesRequired,
              ]),
            ];
          }),
        );

      case 'payouts':
        return throwError(
          () => new Error('Payout report is not connected to a report data endpoint yet.'),
        );

      default:
        return throwError(() => new Error('No data source exists for this report yet.'));
    }
  }

  // ---------- CSV download ----------

  private download(filename: string, rows: (string | number)[][]): void {
    const escapeCsv = (value: string | number): string =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const csv = '\ufeff' + rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }
}
