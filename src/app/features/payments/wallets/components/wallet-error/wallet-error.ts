import { Component, input, output } from '@angular/core';

/** One error box for every wallet screen. */
@Component({
  selector: 'app-wallet-error',
  standalone: true,
  templateUrl: './wallet-error.html',
  styleUrl: './wallet-error.scss',
})
export class WalletError {
  message = input.required<string>();
  notAvailable = input(false);
  retry = output<void>();
}
