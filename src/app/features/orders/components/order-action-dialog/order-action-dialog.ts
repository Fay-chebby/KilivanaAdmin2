import { Component, computed, input, output, signal } from '@angular/core';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { Order, PaymentMethod, farmerPayout, subtotal } from '../../models/order.model';

export type ActionKind =
  | 'payment'
  | 'cancel'
  | 'dispute'
  | 'resolve_buyer'
  | 'resolve_farmer'
  | 'release';
export interface ActionResult {
  reason: string;
  method: PaymentMethod;
  reference: string;
}

@Component({
  selector: 'app-order-action-dialog',
  imports: [CurrencyKshPipe],
  templateUrl: './order-action-dialog.html',
  styleUrl: './order-action-dialog.scss',
})
export class OrderActionDialog {
  readonly kind = input.required<ActionKind>();
  readonly order = input.required<Order>();
  readonly confirmed = output<ActionResult>();
  readonly cancelled = output<void>();

  protected readonly reason = signal('');
  protected readonly method = signal<PaymentMethod>('mpesa');
  protected readonly reference = signal('');
  protected readonly touched = signal(false);

  protected readonly total = computed(() => subtotal(this.order()));
  protected readonly payout = computed(() => farmerPayout(this.order()));

  protected readonly cfg = computed(
    () =>
      ({
        payment: {
          title: 'Record payment',
          label: 'Record payment',
          danger: false,
          fields: 'payment',
        },
        cancel: {
          title: 'Cancel this order?',
          label: 'Cancel order',
          danger: true,
          fields: 'reason',
        },
        dispute: {
          title: 'Raise a dispute?',
          label: 'Raise dispute',
          danger: true,
          fields: 'reason',
        },
        resolve_buyer: {
          title: "Resolve in the buyer's favour?",
          label: 'Refund the buyer',
          danger: true,
          fields: 'reason',
        },
        resolve_farmer: {
          title: "Resolve in the farmer's favour?",
          label: 'Pay the farmer',
          danger: false,
          fields: 'reason',
        },
        release: {
          title: 'Release payment to the farmer?',
          label: 'Release payment',
          danger: false,
          fields: 'none',
        },
      })[this.kind()],
  );

  protected readonly refOk = computed(() => {
    const r = this.reference().trim().toUpperCase();
    return this.method() === 'mpesa' ? /^[A-Z0-9]{10}$/.test(r) : r.length >= 4;
  });
  protected readonly reasonOk = computed(() => this.reason().trim().length >= 5);

  protected submit() {
    this.touched.set(true);
    const f = this.cfg().fields;
    if ((f === 'payment' && !this.refOk()) || (f === 'reason' && !this.reasonOk())) return;
    this.confirmed.emit({
      reason: this.reason().trim(),
      method: this.method(),
      reference: this.reference().trim().toUpperCase(),
    });
  }
}
