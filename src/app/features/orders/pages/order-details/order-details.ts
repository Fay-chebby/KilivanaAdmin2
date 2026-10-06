import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';

import { OrderItemsTable } from '../../components/order-items-table/order-items-table';
import { OrderPipeline } from '../../components/order-pipeline/order-pipeline';
import { OrderTimeline } from '../../components/order-timeline/order-timeline';

import { Order, ORDER_STATUS_META, PAYMENT_META } from '../../models/order.model';

import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-details',
  imports: [RouterLink, CurrencyKshPipe, OrderItemsTable, OrderPipeline, OrderTimeline],
  templateUrl: './order-details.html',
  styleUrl: './order-details.scss',
})
export class OrderDetails {
  private readonly service = inject(OrderService);
  private readonly route = inject(ActivatedRoute);

  protected readonly id = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly order = signal<Order | null>(null);

  protected readonly loading = signal(true);

  protected readonly error = signal<string | null>(null);

  protected readonly meta = ORDER_STATUS_META;

  protected readonly pay = PAYMENT_META;

  constructor() {
    this.loadOrder();
  }

  private loadOrder(): void {
    if (!this.id || Number.isNaN(this.id)) {
      this.error.set('Invalid order ID.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.service.getOrderById(this.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.order.set(response.data);
        } else {
          this.order.set(null);
          this.error.set(response.message || 'Failed to load order.');
        }

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Failed to load order:', error);

        this.order.set(null);

        this.error.set(
          error?.error?.message || 'Unable to load this order from the Kilivana backend.',
        );

        this.loading.set(false);
      },
    });
  }

  protected refresh(): void {
    this.loadOrder();
  }
}
