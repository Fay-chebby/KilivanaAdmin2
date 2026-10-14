import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';

import { OrderItemsTable } from '../../components/order-items-table/order-items-table';
import { OrderPipeline } from '../../components/order-pipeline/order-pipeline';
import { OrderTimeline } from '../../components/order-timeline/order-timeline';

import { Order, OrderStatus, ORDER_STATUS_META, PAYMENT_META } from '../../models/order.model';

import { OrderService } from '../../services/order.service';
import { AssignDriverDialog } from '../../components/assign-driver-dialog/assign-driver-dialog';

@Component({
  selector: 'app-order-details',
  imports: [
    RouterLink,
    CurrencyKshPipe,
    OrderItemsTable,
    OrderPipeline,
    OrderTimeline,
    AssignDriverDialog,
  ],
  templateUrl: './order-details.html',
  styleUrl: './order-details.scss',
})
export class OrderDetails {
  private readonly service = inject(OrderService);
  private readonly route = inject(ActivatedRoute);

  protected readonly id = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly order = signal<Order | null>(null);
  protected readonly loading = signal(true);
  protected readonly updatingStatus = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);

  protected readonly meta = ORDER_STATUS_META;
  protected readonly pay = PAYMENT_META;

  // Driver assignment state.
  protected readonly assigningDriver = signal(false);

  protected readonly driverAssigned = () => this.order()?.driverId != null;

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

    this.service
      .getOrderById(this.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.order.set(response.data);
          } else {
            this.order.set(null);
            this.error.set(response.message || 'Failed to load order.');
          }
        },

        error: (err) => {
          console.error('Failed to load order:', err);
          this.order.set(null);
          this.error.set(
            err?.error?.message || 'Unable to load this order from the Kilivana backend.',
          );
        },
      });
  }

  protected updateOrderStatus(nextStatus: OrderStatus): void {
    const currentOrder = this.order();

    if (!currentOrder || this.updatingStatus() || currentOrder.status === nextStatus) {
      return;
    }

    // A driver must be assigned before delivery begins.
    if (nextStatus === 'IN_TRANSIT' && !this.driverAssigned()) {
      this.error.set('Assign a driver before moving this order into transit.');
      return;
    }

    this.updatingStatus.set(true);
    this.error.set(null);
    this.actionMessage.set(null);

    const request$ =
      nextStatus === 'CANCELLED'
        ? this.service.cancelOrder(this.id)
        : this.service.updateOrderStatus(this.id, nextStatus);

    request$.pipe(finalize(() => this.updatingStatus.set(false))).subscribe({
      next: (response) => {
        if (!response.success) {
          this.error.set(response.message || 'Could not update the order status.');
          return;
        }

        this.actionMessage.set('Order status updated successfully.');

        this.loadOrder();
        this.service.refresh();
      },

      error: (err) => {
        console.error('Failed to update order status:', err);

        this.error.set(err?.error?.message || 'Failed to update the order. Please try again.');
      },
    });
  }

  protected refresh(): void {
    this.actionMessage.set(null);
    this.loadOrder();
  }
  // Driver assignment dialog state
  protected readonly showAssignDriver = signal(false);

  protected openAssignDriver(): void {
    this.error.set(null);
    this.showAssignDriver.set(true);
  }

  protected closeAssignDriver(): void {
    this.showAssignDriver.set(false);
  }

  protected handleDriverAssignment(driverId: string | number): void {
    const numericDriverId = Number(driverId);

    if (!Number.isInteger(numericDriverId) || numericDriverId <= 0) {
      this.error.set('Please select a valid driver.');
      return;
    }

    if (this.assigningDriver()) {
      return;
    }

    this.assigningDriver.set(true);
    this.error.set(null);
    this.actionMessage.set(null);

    this.service
      .assignDriver(this.id, numericDriverId)
      .pipe(finalize(() => this.assigningDriver.set(false)))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.error.set(response.message || 'The driver could not be assigned.');
            return;
          }

          this.showAssignDriver.set(false);
          this.actionMessage.set('Driver assigned successfully.');

          this.loadOrder();
          this.service.refresh();
        },
        error: (err) => {
          console.error('Driver assignment failed:', err);

          this.error.set(err?.error?.message || 'Unable to assign the driver. Please try again.');
        },
      });
  }
}
