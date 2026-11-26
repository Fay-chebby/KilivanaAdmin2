import { Component, computed, input } from '@angular/core';
import { fmtDateTime, kesExact } from '../../models/wallet.model';
import { SellerWallet, sellerTypeLabel } from '../../models/seller-wallet.model';
import { statusLabel, statusTone } from '../../models/wallet-transaction.model';
import { WalletBalanceCard } from '../wallet-balance-card/wallet-balance-card';

/** Header for one seller: who they are and their four balances. */
@Component({
  selector: 'app-wallet-account-summary',
  standalone: true,
  imports: [WalletBalanceCard],
  templateUrl: './wallet-account-summary.html',
  styleUrl: './wallet-account-summary.scss',
})
export class WalletAccountSummary {
  wallet = input<SellerWallet | null>(null);
  loading = input(false);

  readonly kes = kesExact;
  readonly date = fmtDateTime;
  readonly typeLabel = sellerTypeLabel;
  readonly label = statusLabel;
  readonly tone = statusTone;
  readonly money = (n: number | undefined) => (this.wallet() ? kesExact(n) : '');
  readonly toneClass = computed(() => statusTone(this.wallet()?.status ?? ''));
}
