import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Page, fmtDateTime, kesExact } from '../../models/wallet.model';
import { SortDir } from '../../models/Wallet filter.model';
import { SellerWallet, sellerTypeLabel } from '../../models/seller-wallet.model';
import { statusLabel, statusTone } from '../../models/wallet-transaction.model';


@Component({
  selector: 'app-seller-wallet-table',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './seller-wallet-table.html',
  styleUrl: './seller-wallet-table.scss',
})
export class SellerWalletTable {
  data = input<Page<SellerWallet> | null>(null);
  loading = input(false);
  sort = input('availableBalance');
  dir = input<SortDir>('desc');

  sortChange = output<string>();
  pageChange = output<number>();

  readonly kes = kesExact;
  readonly date = fmtDateTime;
  readonly typeLabel = sellerTypeLabel;
  readonly label = statusLabel;
  readonly tone = statusTone;

  readonly rows = computed(() => this.data()?.content ?? []);
  readonly page = computed(() => this.data()?.number ?? 0);
  readonly pages = computed(() => Math.max(1, this.data()?.totalPages ?? 1));
  readonly range = computed(() => {
    const d = this.data();
    if (!d || !d.totalElements) return '';
    const start = d.number * d.size + 1;
    return `Showing ${start}–${start + d.content.length - 1} of ${d.totalElements}`;
  });
  readonly placeholders = [1, 2, 3, 4, 5];

  ariaSort(f: string) {
    return this.sort() === f ? (this.dir() === 'asc' ? 'ascending' : 'descending') : 'none';
  }
  arrow(f: string) {
    return this.sort() === f ? (this.dir() === 'asc' ? '▲' : '▼') : '';
  }
}
