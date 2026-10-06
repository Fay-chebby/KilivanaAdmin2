import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  input,
  output,
  viewChild,
} from '@angular/core';

/** Confirmation for actions that move money. Uses the native <dialog>, so focus is trapped and Esc closes it. */
@Component({
  selector: 'app-payment-action-dialog',
  standalone: true,
  templateUrl: './payment-action-dialog.html',
  styleUrl: './payment-action-dialog.scss',
})
export class PaymentActionDialog implements AfterViewInit, OnDestroy {
  title = input.required<string>();
  message = input('');
  lines = input<string[]>([]);
  confirmLabel = input('Confirm');
  tone = input<'green' | 'red'>('green');

  confirmed = output<void>();
  dismissed = output<void>();

  private dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  private opener =
    typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;

  ngAfterViewInit() {
    this.dlg().nativeElement.showModal();
  }
  ngOnDestroy() {
    this.opener?.focus?.();
  }

  onEsc(e: Event) {
    e.preventDefault();
    this.dismissed.emit();
  }
  onBackdrop(e: MouseEvent) {
    if (e.target === this.dlg().nativeElement) this.dismissed.emit();
  }
}
