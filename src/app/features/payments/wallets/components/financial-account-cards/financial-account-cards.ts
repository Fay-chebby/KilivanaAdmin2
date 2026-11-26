import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fmtDateTime, kesExact } from '../../models/wallet.model';
import { FinancialAccount } from '../../models/finance-account.model';
import { statusLabel, statusTone } from '../../models/wallet-transaction.model';

@Component({
  selector: 'app-financial-account-cards',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './financial-account-cards.html',
  styleUrl: './financial-account-cards.scss',
})
export class FinancialAccountCards {
  accounts = input<FinancialAccount[]>([]);
  loading = input(false);

  readonly kes = kesExact;
  readonly date = fmtDateTime;
  readonly label = statusLabel;
  readonly tone = statusTone;
  readonly placeholders = [1, 2, 3, 4, 5, 6, 7];
}
