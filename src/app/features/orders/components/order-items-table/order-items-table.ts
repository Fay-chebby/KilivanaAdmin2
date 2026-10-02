import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import {
  Order,
  PLATFORM_FEE_RATE,
  farmerPayout,
  platformFee,
  subtotal,
} from '../../models/order.model';

@Component({
  selector: 'app-order-items-table',
  imports: [RouterLink, CurrencyKshPipe],
  templateUrl: './order-items-table.html',
  styleUrl: './order-items-table.scss',
})
export class OrderItemsTable {
  readonly order = input.required<Order>();

  protected readonly rate = PLATFORM_FEE_RATE * 100;
  protected readonly total = computed(() => subtotal(this.order()));
  protected readonly fee = computed(() => platformFee(this.order()));
  protected readonly payout = computed(() => farmerPayout(this.order()));

  protected num(n: number) {
    return n.toLocaleString('en-KE');
  }
}
