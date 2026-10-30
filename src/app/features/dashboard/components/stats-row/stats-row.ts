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

  private readonly money = new CurrencyKshPipe();

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
    let delta = '';
    let positive = true;

    if (card.deltaText) {
      delta = card.deltaText;
    } else if (card.changePct !== undefined) {
      positive = card.changePct >= 0;
      delta = `${positive ? '↑' : '↓'} ${Math.abs(card.changePct)}% vs last month`;
    }

    return {
      label: card.label,
      icon,
      tone,
      value:
        card.format === 'currency'
          ? this.money.transform(card.value, true)
          : card.value.toLocaleString('en-US'),
      delta,
      positive,
    };
  }
}
