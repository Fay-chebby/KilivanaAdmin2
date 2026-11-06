import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, combineLatest, of, switchMap, tap } from 'rxjs';

import { ExportButton } from '../../components/export-button/export-button';
import { ReportChart } from '../../components/report-chart/report-chart';
import { ReportFilters } from '../../components/report-filters/report-filters';

import { DateRange, ExportFormat, Kpi, ReportId, rangeFromPreset } from '../../models/report.model';

import { ReportService } from '../../services/report.service';

const describe = (e: unknown): string => {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) {
      return 'Cannot reach the server. Check your connection, API URL and CORS settings.';
    }

    if (e.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }

    if (e.status === 403) {
      return 'You do not have permission to view reports.';
    }

    return e.error?.message ?? `Request failed (${e.status}).`;
  }

  return e instanceof Error ? e.message : 'Something went wrong.';
};

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [ReportFilters, ExportButton, ReportChart],
  templateUrl: './reports-dashboard.html',
  styleUrl: './reports-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsDashboard {
  private readonly service = inject(ReportService);
  private readonly router = inject(Router);

  // Available report definitions.
  readonly reports = this.service.reports;

  // Selected date range.
  readonly range = signal<DateRange>(rangeFromPreset('30d'));

  private readonly reloadTick = signal(0);

  // Dashboard loading state.
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  // Export state.
  readonly exporting = signal<ReportId | 'overview' | null>(null);

  readonly skeleton = [1, 2, 3, 4];

  // Load dashboard overview.
  readonly overview = toSignal(
    combineLatest([toObservable(this.range), toObservable(this.reloadTick)]).pipe(
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),

      switchMap(([range]) =>
        this.service.getOverview(range).pipe(
          catchError((e: unknown) => {
            this.error.set(describe(e));
            return of(undefined);
          }),
        ),
      ),

      tap(() => {
        this.loading.set(false);
      }),
    ),
    {
      initialValue: undefined,
    },
  );

  // Retry dashboard loading.
  retry(): void {
    this.reloadTick.update((n) => n + 1);
  }

  // Navigate to a separate report details page.
  viewReport(id: ReportId): void {
    this.router.navigate(['/reports/details', id]);
  }

  // Export overview or individual reports.
  onExport(id: ReportId | 'overview', format: ExportFormat): void {
    this.exporting.set(id);
    this.notice.set(null);

    this.service.export(id, format, this.range()).subscribe({
      next: () => {
        this.exporting.set(null);
        this.notice.set('Report export completed successfully.');
      },

      error: (e: unknown) => {
        this.exporting.set(null);
        this.notice.set(describe(e));
      },
    });
  }

  // Format KPI values.
  kpiValue(k: Kpi): string {
    switch (k.format) {
      case 'currency':
        return `KES ${Math.round(k.value).toLocaleString('en')}`;

      case 'percent':
        return `${k.value.toFixed(1)}%`;

      default:
        return Math.round(k.value).toLocaleString('en');
    }
  }

  // Determine whether a KPI change is positive.
  isGood(k: Kpi): boolean {
    if (k.change === null) {
      return true;
    }

    return k.invertTrend ? k.change <= 0 : k.change >= 0;
  }
}
