import { Component, computed, input } from '@angular/core';
import { AdminWalletOverview, MetricKey, kesExact } from '../../models/wallet.model';

interface Card {
  key: MetricKey;
  label: string;
  hint: string;
  tone: 'green' | 'blue' | 'amber' | 'red' | 'gray';
  icon: string;
}

const CARDS: Card[] = [
  {
    key: 'totalFundsReceived',
    label: 'Total Funds Received',
    hint: 'Successful buyer payments',
    tone: 'green',
    icon: 'M12 4v12m0 0l-4-4m4 4l4-4M5 20h14',
  },
  {
    key: 'platformRevenue',
    label: 'Platform Revenue',
    hint: 'Commission Kilivana has earned',
    tone: 'green',
    icon: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  },
  {
    key: 'sellerPayables',
    label: 'Seller Payables',
    hint: 'Owed to farmers and suppliers. Not revenue',
    tone: 'blue',
    icon: 'M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21c0-4 4-6 8-6s8 2 8 6',
  },
  {
    key: 'availablePlatformFunds',
    label: 'Available Platform Funds',
    hint: 'Settled funds the platform holds',
    tone: 'green',
    icon: 'M3 7h18v12H3zM3 11h18M16 15h2',
  },
  {
    key: 'pendingPayouts',
    label: 'Pending Payouts',
    hint: 'Reserved for sellers, not yet paid',
    tone: 'amber',
    icon: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    key: 'completedPayouts',
    label: 'Completed Payouts',
    hint: 'Already paid to sellers',
    tone: 'gray',
    icon: 'M5 13l4 4L19 7',
  },
  {
    key: 'pendingRefunds',
    label: 'Pending Refunds',
    hint: 'Owed back to buyers',
    tone: 'red',
    icon: 'M9 14l-4-4 4-4M5 10h9a5 5 0 010 10h-3',
  },
  {
    key: 'paymentProcessingFees',
    label: 'Payment Processing Fees',
    hint: 'Charged by the payment provider',
    tone: 'gray',
    icon: 'M4 6h16M4 12h16M4 18h10',
  },
];

@Component({
  selector: 'app-wallet-overview-cards',
  standalone: true,
  templateUrl: './wallet-overview-cards.html',
  styleUrl: './wallet-overview-cards.scss',
})
export class WalletOverviewCards {
  overview = input<AdminWalletOverview | null>(null);
  loading = input(false);

  readonly cards = computed(() => {
    const o = this.overview();
    return CARDS.map((c) => {
      const change = o?.comparison?.[c.key];
      return {
        ...c,
        value: o ? kesExact(o[c.key]) : '',
        change: change == null ? null : change,
        changeText:
          change == null ? '' : `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs previous period`,
      };
    });
  });
  readonly placeholders = [1, 2, 3, 4, 5, 6, 7, 8];
}
