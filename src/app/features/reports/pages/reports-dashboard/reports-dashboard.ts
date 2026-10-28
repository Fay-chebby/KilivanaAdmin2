import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, combineLatest, finalize, of, switchMap, tap } from 'rxjs';

import { ExportButton } from '../../components/export-button/export-button';
import { ReportChart } from '../../components/report-chart/report-chart';
import { ReportFilters } from '../../components/report-filters/report-filters';

import { DateRange, ExportFormat, Kpi, ReportId, rangeFromPreset } from '../../models/report.model';

import { ReportService } from '../../services/report.service';
import type { ReportTable } from '../../services/report.service';

const describe = (e: unknown): string => {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) {
      return 'Cannot reach the server. Check your connection, the API URL and CORS settings.';
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
  imports: [RouterLink, ReportFilters, ExportButton, ReportChart],
  templateUrl: './reports-dashboard.html',
  styleUrl: './reports-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsDashboard {
  private readonly service = inject(ReportService);

  // Available report definitions.
  // This is an ordinary array, not a signal.
  readonly reports = this.service.reports;

  // Selected date range.
  readonly range = signal<DateRange>(rangeFromPreset('30d'));

  private readonly reloadTick = signal(0);

  // Dashboard state.
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  readonly exporting = signal<ReportId | 'overview' | null>(null);

  readonly skeleton = [1, 2, 3, 4];

  // Inline report preview state.
  readonly selectedReport = signal<ReportId | null>(null);
  readonly reportData = signal<ReportTable | null>(null);
  readonly viewingReport = signal(false);
  readonly reportLoading = signal(false);
  readonly reportError = signal<string | null>(null);

  // Load the overview when the date range changes
  // or when the user retries.
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
    { initialValue: undefined },
  );

  // Retry dashboard loading.
  retry(): void {
    this.reloadTick.update((n) => n + 1);
  }

  // Open a report preview inside this dashboard.
  viewReport(id: ReportId): void {
    this.selectedReport.set(id);
    this.reportData.set(null);
    this.reportError.set(null);
    this.reportLoading.set(true);
    this.viewingReport.set(true);

    this.service
      .getReport(id, this.range())
      .pipe(
        finalize(() => {
          this.reportLoading.set(false);
        }),
      )
      .subscribe({
        next: (report: ReportTable) => {
          this.reportData.set(report);
        },
        error: (e: unknown) => {
          this.reportError.set(describe(e));
        },
      });
  }

  // Close the inline preview.
  closeReport(): void {
    this.viewingReport.set(false);
    this.selectedReport.set(null);
    this.reportData.set(null);
    this.reportError.set(null);
    this.reportLoading.set(false);
  }

  // Reload the currently selected report.
  refreshReport(): void {
    const id = this.selectedReport();

    if (id !== null) {
      this.viewReport(id);
    }
  }

  // Export the overview or an individual report.
  onExport(id: ReportId | 'overview', format: ExportFormat): void {
    this.exporting.set(id);
    this.notice.set(null);

    this.service
      .export(id, format, this.range())
      .pipe(
        finalize(() => {
          this.exporting.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.notice.set('Report export completed.');
        },
        error: (e: unknown) => {
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

  // Format column names for the preview table.
  formatColumn(column: string): string {
    return column.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  // Safely retrieve a cell using its column name.
  // This avoids implicit-any errors from row[column] in the template.
  getCellValue(row: (string | number)[], columnIndex: number): string | number {
    const value = row[columnIndex];

    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    return JSON.stringify(value);
  }
}
