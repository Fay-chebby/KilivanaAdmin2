import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { PLATFORM_FEE_RATE } from '../../../orders/models/order.model';
import { Dispute, Outcome } from '../../models/dispute.model';
import { DisputeService } from '../../services/dispute.service';

export interface ResolveResult {
  outcome: Outcome;
  refundKes: number;
  note: string;
}

@Component({
  selector: 'app-resolve-dispute-dialog',
  imports: [CurrencyKshPipe],
  templateUrl: './resolve-dispute-dialog.html',
  styleUrl: './resolve-dispute-dialog.scss',
})
export class ResolveDisputeDialog {
  protected readonly service = inject(DisputeService);
  readonly dispute = input.required<Dispute>();
  readonly resolved = output<ResolveResult>();
  readonly cancelled = output<void>();

  protected readonly outcome = signal<Outcome>('refund_buyer');
  protected readonly partial = signal(0);
  protected readonly note = signal('');
  protected readonly touched = signal(false);

  private readonly fee = (n: number) => Math.round(n * PLATFORM_FEE_RATE);

  protected readonly refund = computed(() => {
    const a = this.dispute().amountKes;
    return this.outcome() === 'refund_buyer'
      ? a
      : this.outcome() === 'partial_refund'
        ? Math.round(this.partial())
        : 0;
  });
  protected readonly farmerGets = computed(() => {
    const keep = this.dispute().amountKes - this.refund();
    return keep - this.fee(keep);
  });
  protected readonly partialOk = computed(
    () =>
      this.outcome() !== 'partial_refund' ||
      (this.partial() > 0 && this.partial() < this.dispute().amountKes),
  );
  protected readonly noteOk = computed(() => this.note().trim().length >= 10);

  protected readonly options = computed(() => [
    {
      id: 'refund_buyer' as Outcome,
      title: 'Refund the buyer',
      disabled: false,
      sub: 'The order is cancelled and the full amount goes back to the buyer.',
    },
    {
      id: 'pay_farmer' as Outcome,
      title: 'Pay the farmer',
      disabled: false,
      sub: "The buyer's claim is rejected and the farmer is paid after the platform fee.",
    },
    {
      id: 'partial_refund' as Outcome,
      title: 'Partial refund',
      disabled: !this.service.caps.partialRefund,
      sub: this.service.caps.partialRefund
        ? 'Split the money: part back to the buyer, the rest to the farmer.'
        : 'Not available yet. The server can only refund in full or pay the farmer in full.',
    },
  ]);

  protected submit() {
    this.touched.set(true);
    if (!this.partialOk() || !this.noteOk()) return;
    this.resolved.emit({
      outcome: this.outcome(),
      refundKes: this.refund(),
      note: this.note().trim(),
    });
  }
}
