import { Component, HostListener, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-driver-action-dialog',
  templateUrl: './driver-action-dialog.html',
  styleUrl: './driver-action-dialog.scss',
})
export class DriverActionDialog {
  title = input.required<string>();
  message = input.required<string>();
  confirmLabel = input('Confirm');
  tone = input<'danger' | 'warning' | 'success'>('danger');
  requireReason = input(false);

  confirmed = output<string>();
  cancelled = output<void>();

  reason = signal('');
  canConfirm = computed(() => !this.requireReason() || this.reason().trim().length >= 3);

  onReason(event: Event) {
    this.reason.set((event.target as HTMLTextAreaElement).value);
  }

  submit() {
    if (this.canConfirm()) this.confirmed.emit(this.reason().trim());
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.cancelled.emit();
  }
}
