import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ExportButton } from '../../components/export-button/export-button';
import { ReportFilters } from '../../components/report-filters/report-filters';

import {
  DateRange,
  ExportFormat,
  ReportDefinition,
  ReportId,
  rangeFromPreset,
} from '../../models/report.model';

import { ReportService, ReportTable } from '../../services/report.service';

const describe = (e: unknown): string => {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) {
      return 'Cannot reach the server. Check your connection and API configuration.';
    }

    if (e.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }

    if (e.status === 403) {
      return 'You do not have permission to view this report.';
    }

    return e.error?.message ?? `Request failed (${e.status}).`;
  }

  return e instanceof Error ? e.message : 'Something went wrong.';
};

@Component({
  selector: 'app-report-details',
  standalone: true,
  imports: [ExportButton, ReportFilters],
  templateUrl: './report-details.html',
  styleUrl: './report-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportDetails {
  private readonly service = inject(ReportService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Selected report.
  readonly report = signal<ReportDefinition | null>(null);

  // Date range.
  readonly range = signal<DateRange>(rangeFromPreset('30d'));

  // Report data.
  readonly reportData = signal<ReportTable | null>(null);

  // Loading and error states.
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  // Export state.
  readonly exporting = signal(false);

  constructor() {
    this.initializeReport();
  }

  // Identify the report from the URL.
  private initializeReport(): void {
    const reportId = this.route.snapshot.paramMap.get('reportId');

    const selected = this.service.reports.find((report) => report.id === reportId);

    if (!selected) {
      this.router.navigate(['/reports']);
      return;
    }

    this.report.set(selected);
    this.loadReport();
  }

  // Load report data.
  loadReport(): void {
    const selected = this.report();

    if (!selected) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.reportData.set(null);

    this.service
      .getReport(selected.id, this.range())
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (data: ReportTable) => {
          this.reportData.set(data);
        },

        error: (e: unknown) => {
          this.error.set(describe(e));
        },
      });
  }

  // Change report date range.
  onRangeChange(range: DateRange): void {
    this.range.set(range);
    this.loadReport();
  }

  // Refresh report.
  refreshReport(): void {
    this.loadReport();
  }

  // Return to reports dashboard.
  backToReports(): void {
    this.router.navigate(['/reports']);
  }

  // Export selected report.
  onExport(format: ExportFormat): void {
    const selected = this.report();

    if (!selected || !selected.exportable) {
      return;
    }

    this.exporting.set(true);
    this.notice.set(null);

    this.service
      .export(selected.id, format, this.range())
      .pipe(
        finalize(() => {
          this.exporting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.notice.set('Report exported successfully.');
        },

        error: (e: unknown) => {
          this.notice.set(describe(e));
        },
      });
  }

  // Format column names.
  formatColumn(column: string): string {
    return column.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  // Retrieve a cell safely.
  getCellValue(row: (string | number)[], columnIndex: number): string | number {
    const value = row[columnIndex];

    if (value === null || value === undefined || value === '') {
      return '—';
    }

    return value;
  }

  // Number of rows.
  get totalRows(): number {
    return this.reportData()?.rows.length ?? 0;
  }

  // Number of columns.
  get totalColumns(): number {
    return this.reportData()?.columns.length ?? 0;
  }
}
