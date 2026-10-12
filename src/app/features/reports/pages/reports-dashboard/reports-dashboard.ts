import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, switchMap, tap } from 'rxjs';
import { ExportButton } from '../../components/export-button/export-button';
import { ReportChart } from '../../components/report-chart/report-chart';
import { ReportFilters } from '../../components/report-filters/report-filters';
import { DateRange, ExportFormat, Kpi, ReportId, rangeFromPreset } from '../../models/report.model';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-reports-dashboard',
  imports: [RouterLink, ReportFilters, ExportButton, ReportChart],
  templateUrl: './reports-dashboard.html',
  styleUrl: './reports-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsDashboard {
  private readonly service = inject(ReportService);

  readonly reports = this.service.reports;
  readonly range = signal<DateRange>(rangeFromPreset('30d'));
  readonly loading = signal(true);
  readonly exporting = signal<ReportId | 'overview' | null>(null);
  readonly skeleton = [1, 2, 3, 4];

  readonly overview = toSignal(
    toObservable(this.range).pipe(
      tap(() => this.loading.set(true)),
      switchMap((r) => this.service.getOverview(r)),
      tap(() => this.loading.set(false)),
    ),
  );

  onExport(id: ReportId | 'overview', format: ExportFormat) {
    this.exporting.set(id);
    this.service
      .export(id, format, this.range())
      .pipe(finalize(() => this.exporting.set(null)))
      .subscribe(); // TODO: hook up ToastService for success / error feedback
  }

  kpiValue(k: Kpi) {
    switch (k.format) {
      case 'currency':
        return `GH₵ ${Math.round(k.value).toLocaleString('en')}`;
      case 'percent':
        return `${k.value.toFixed(1)}%`;
      default:
        return Math.round(k.value).toLocaleString('en');
    }
  }

  isGood(k: Kpi) {
    return k.invertTrend ? k.change <= 0 : k.change >= 0;
  }
}
