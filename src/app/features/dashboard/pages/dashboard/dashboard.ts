import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ActivityList } from '../../components/activity-list/activity-list';
import { AlertsPanel } from '../../components/alerts-panel/alerts-panel';
import { CropDonut } from '../../components/crop-donut/crop-donut';
import { MiniStatsRow } from '../../components/mini-stats-row/mini-stats-row';
import { OrderChart } from '../../components/order-chart/order-chart';
import { StatsRow } from '../../components/stats-row/stats-row';
import { DashboardData } from '../../models/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    PageHeader,
    LoadingSpinner,
    StatsRow,
    MiniStatsRow,
    OrderChart,
    CropDonut,
    ActivityList,
    AlertsPanel,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly service = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = signal<DashboardData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service
      .getDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.data.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('We could not load the dashboard data.');
          this.loading.set(false);
        },
      });
  }
}
