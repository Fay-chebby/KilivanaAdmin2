import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-buyer-action-dialog',
  standalone: true,
  templateUrl: './buyer-action-dialog.html',
  styleUrl: './buyer-action-dialog.scss',
})
export class BuyerActionDialog {
  open = input(false);
  title = input('Confirm');
  message = input('');
  confirmLabel = input('Confirm');
  danger = input(false);
  loading = input(false);

  confirmed = output<void>();
  cancelled = output<void>();
}
