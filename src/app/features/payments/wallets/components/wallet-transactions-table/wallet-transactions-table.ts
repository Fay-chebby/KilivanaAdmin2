import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { Page } from '../../models/wallet.model';
import { WalletTransaction } from '../../models/wallet-transaction.model';

@Component({
  selector: 'app-wallet-transactions-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet-transactions-table.html',
  styleUrl: './wallet-transactions-table.scss',
})
export class WalletTransactionsTable {
  readonly data = input<Page<WalletTransaction> | null>(null);
  readonly loading = input(false);
  readonly sort = input('');

  readonly sortChange = output<string>();
  readonly pageChange = output<number>();
  readonly select = output<WalletTransaction>();
}
