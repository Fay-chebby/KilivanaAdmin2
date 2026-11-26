import { Component, input } from '@angular/core';

@Component({
  selector: 'app-wallet-balance-card',
  standalone: true,
  templateUrl: './wallet-balance-card.html',
  styleUrl: './wallet-balance-card.scss',
})
export class WalletBalanceCard {
  label = input.required<string>();
  value = input('');
  hint = input('');
  tone = input<'green' | 'amber' | 'blue' | 'gray'>('gray');
  loading = input(false);
}
