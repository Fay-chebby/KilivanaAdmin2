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

  showReason = input(false);
  reason = input('');

  confirmed = output<void>();
  cancelled = output<void>();
  reasonChange = output<string>();

  onReasonChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.reasonChange.emit(value);
  }
}
