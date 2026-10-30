import { Component, computed, input } from '@angular/core';
import { StatCard, StatTone } from '../../../../shared/components/stat-card/stat-card';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { DashboardStats, StatCardData } from '../../models/dashboard.model';

@Component({
  selector: 'app-stats-row',
  imports: [StatCard],
  templateUrl: './stats-row.html',
  styleUrl: './stats-row.scss',
})
export class StatsRow {
  readonly stats = input.required<DashboardStats>();

  private readonly ksh = new CurrencyKshPipe();

  protected readonly cards = computed(() => {
    const s = this.stats();

    return [
      this.toView(s.totalFarmers, 'user', 'green'),
      this.toView(s.totalBuyers, 'cart', 'blue'),
      this.toView(s.activeOrders, 'box', 'amber'),
      this.toView(s.monthlyRevenue, 'trend', 'red'),
    ];
  });

  private toView(card: StatCardData, icon: string, tone: StatTone) {
    const changePct = card.changePct ?? 0;
    const up = changePct >= 0;

    return {
      label: card.label,
      icon,
      tone,
      value:
        card.format === 'currency'
          ? this.ksh.transform(card.value, true)
          : card.value.toLocaleString('en-US'),
      delta: card.deltaText
        ? `↑ ${card.deltaText}`
        : changePct === 0
          ? 'No comparison data available'
          : `${up ? '↑' : '↓'} ${Math.abs(changePct)}% vs last month`,
      positive: up,
    };
  }
}
