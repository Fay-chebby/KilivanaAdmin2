import { Component, computed, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type ApprovalMode = 'idle' | 'reject';

@Component({
  selector: 'app-approval-actions',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './approval-actions.html',
  styleUrl: './approval-actions.scss',
})
export class ApprovalActions {
  /** Why approving is blocked right now, e.g. "Open 2 more documents". Empty means approval is allowed. */
  blockedReason = input('');
  /** Set by the page, so the table's reject icon can open the reason box. */
  mode = model<ApprovalMode>('idle');
  error = input('');

  approve = output<void>();
  reject = output<string>();

  reason = signal('');
  readonly tooShort = computed(() => this.reason().trim().length < 10);

  startReject() {
    this.mode.set('reject');
  }
  cancel() {
    this.mode.set('idle');
    this.reason.set('');
  }

  confirmReject() {
    if (this.tooShort()) return;
    this.reject.emit(this.reason().trim());
  }
}
