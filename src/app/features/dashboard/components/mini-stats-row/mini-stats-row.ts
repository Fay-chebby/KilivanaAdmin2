import { Component, input } from '@angular/core';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { DashboardStats } from '../../models/dashboard.model';

@Component({
  selector: 'app-mini-stats-row',
  imports: [StatCard, CurrencyKshPipe],
  templateUrl: './mini-stats-row.html',
  styleUrl: './mini-stats-row.scss',
})
export class MiniStatsRow {
  readonly stats = input.required<DashboardStats>();
}
