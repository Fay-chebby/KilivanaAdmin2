import { Component, computed, input } from '@angular/core';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-ghs-pipe';
import { DashboardStats, StatCardData } from '../../models/dashboard.model';

@Component({
  selector: 'app-stats-row',
  imports: [StatCard],
  templateUrl: './stats-row.html',
  styleUrl: './stats-row.scss',
})
export class StatsRow {
  readonly stats = input.required<DashboardStats>();

  private readonly ghs = new CurrencyKshPipe();

  protected readonly cards = computed(() => {
    const s = this.stats();
    return [
      this.toView(s.totalFarmers, 'user'),
      this.toView(s.totalBuyers, 'cart'),
      this.toView(s.activeOrders, 'box'),
      this.toView(s.monthlyRevenue, 'trend'),
    ];
  });

  private toView(card: StatCardData, icon: string) {
    const up = card.changePct >= 0;
    return {
      label: card.label,
      icon,
      value:
        card.format === 'currency'
          ? this.ghs.transform(card.value, true)
          : card.value.toLocaleString('en-US'),
      delta: card.deltaText
        ? `↑ ${card.deltaText}`
        : `${up ? '↑' : '↓'} ${Math.abs(card.changePct)}% vs last month`,
      positive: up,
    };
  }
}
