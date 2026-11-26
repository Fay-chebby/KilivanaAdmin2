import { Component, computed, input } from '@angular/core';
import { AdminWalletBreakdown, kesExact } from '../../models/wallet.model';

interface Row {
  label: string;
  value: string;
  note?: string;
  strong?: boolean;
}
interface Group {
  title: string;
  caption: string;
  rows: Row[];
}

@Component({
  selector: 'app-wallet-balance-breakdown',
  standalone: true,
  templateUrl: './wallet-balance-breakdown.html',
  styleUrl: './wallet-balance-breakdown.scss',
})
export class WalletBalanceBreakdown {
  breakdown = input<AdminWalletBreakdown | null>(null);
  loading = input(false);

  readonly groups = computed<Group[]>(() => {
    const b = this.breakdown();
    if (!b) return [];
    const k = kesExact;
    return [
      {
        title: 'Gross transaction volume',
        caption: 'All money buyers paid',
        rows: [
          {
            label: 'Total successful payments received',
            value: k(b.totalSuccessfulPayments),
            strong: true,
          },
        ],
      },
      {
        title: 'Settlement status',
        caption: 'Settled versus still pending',
        rows: [
          {
            label: 'Funds awaiting settlement',
            value: k(b.fundsAwaitingSettlement),
            note: 'Pending',
          },
          { label: 'Settled funds', value: k(b.settledFunds), note: 'Settled' },
        ],
      },
      {
        title: 'Owed by Kilivana',
        caption: 'Not platform revenue',
        rows: [
          { label: 'Seller payable balances', value: k(b.sellerPayableBalances) },
          { label: 'Funds reserved for payouts', value: k(b.fundsReservedForPayouts) },
          { label: 'Refund liabilities', value: k(b.refundLiabilities) },
        ],
      },
      {
        title: 'Actual platform revenue',
        caption: 'What Kilivana keeps',
        rows: [
          { label: 'Platform commission earned', value: k(b.platformCommissionEarned) },
          { label: 'Payment processing expenses', value: k(b.paymentProcessingExpenses) },
          { label: 'Net platform revenue', value: k(b.netPlatformRevenue), strong: true },
        ],
      },
    ];
  });
}
