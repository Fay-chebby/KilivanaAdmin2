import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.scss',
})
export class ConfirmModal {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly danger = input(false);
  /** shows a required reason textarea (used for suspend) */
  readonly askReason = input(false);

  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  protected readonly reason = signal('');

  protected canConfirm() {
    return !this.askReason() || this.reason().trim().length >= 3;
  }

  protected confirm() {
    if (this.canConfirm()) this.confirmed.emit(this.reason().trim());
  }
}
