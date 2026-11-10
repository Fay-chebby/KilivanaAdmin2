import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';

import { OrderItemsTable } from '../../components/order-items-table/order-items-table';
import { OrderPipeline } from '../../components/order-pipeline/order-pipeline';
import { OrderTimeline } from '../../components/order-timeline/order-timeline';
import { AssignDriverDialog } from '../../components/assign-driver-dialog/assign-driver-dialog';

import {
  Order,
  OrderItem,
  OrderStatus,
  OrderBuyer,
  OrderSeller,
  OrderDriver,
  PaymentStatus,
  ORDER_STATUS_META,
  PAYMENT_META,
} from '../../models/order.model';

import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-details',
  imports: [
    RouterLink,
    DecimalPipe,
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

  /* -----------------------------
     Order state
  ----------------------------- */

  protected readonly order = signal<Order | null>(null);

  protected readonly loading = signal(true);

  protected readonly updatingStatus = signal(false);

  protected readonly error = signal<string | null>(null);

  protected readonly actionMessage = signal<string | null>(null);

  protected readonly meta = ORDER_STATUS_META;

  protected readonly pay = PAYMENT_META;

  /* -----------------------------
     Driver assignment state
  ----------------------------- */

  protected readonly assigningDriver = signal(false);

  protected readonly showAssignDriver = signal(false);

  protected readonly driverAssigned = () => {
    const currentOrder = this.order();

    return (
      currentOrder?.driverId != null ||
      currentOrder?.delivery?.driverId != null ||
      currentOrder?.delivery?.driver != null ||
      currentOrder?.driver != null
    );
  };
  /* -----------------------------
     payment
  ----------------------------- */

  protected getPaymentMeta(status: string | null | undefined) {
    if (!status) {
      return null;
    }

    const normalizedStatus = status.toUpperCase() as PaymentStatus;

    return this.pay[normalizedStatus] ?? null;
  }
  /* -----------------------------
     Constructor
  ----------------------------- */

  constructor() {
    this.loadOrder();
  }

  /* -----------------------------
     Load order
  ----------------------------- */

  private loadOrder(): void {
    if (!this.id || Number.isNaN(this.id)) {
      this.order.set(null);
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
            err?.error?.error?.details ||
              err?.error?.message ||
              'Unable to load this order from the Kilivana backend.',
          );
        },
      });
  }

  /* -----------------------------
     Buyer name
  ----------------------------- */

  protected getBuyerName(buyer?: OrderBuyer | null): string {
    if (!buyer) {
      return `Buyer #${this.order()?.buyerId ?? ''}`;
    }

    return (
      buyer.fullName ||
      [buyer.firstName, buyer.lastName].filter(Boolean).join(' ') ||
      `Buyer #${buyer.id}`
    );
  }

  /* -----------------------------
     Seller name
  ----------------------------- */

  protected getSellerName(seller?: OrderSeller | null, sellerId?: number): string {
    if (!seller) {
      return `Seller #${sellerId ?? ''}`;
    }

    return (
      seller.businessName ||
      seller.name ||
      seller.fullName ||
      [seller.firstName, seller.lastName].filter(Boolean).join(' ') ||
      `Seller #${seller.id}`
    );
  }

  /* -----------------------------
     Driver name
  ----------------------------- */

  protected getDriverName(driver?: OrderDriver | null): string {
    if (!driver) {
      return 'No driver assigned';
    }

    return (
      driver.fullName ||
      driver.name ||
      [driver.firstName, driver.lastName].filter(Boolean).join(' ') ||
      `Driver #${driver.id}`
    );
  }

  /* -----------------------------
     Order item seller
  ----------------------------- */

  protected getItemSellerName(item: OrderItem): string {
    return this.getSellerName(item.seller, item.sellerId);
  }

  /* -----------------------------
     Update order status
  ----------------------------- */

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

        this.error.set(
          err?.error?.error?.details ||
            err?.error?.message ||
            'Failed to update the order. Please try again.',
        );
      },
    });
  }

  /* -----------------------------
     Refresh order
  ----------------------------- */

  protected refresh(): void {
    this.actionMessage.set(null);
    this.loadOrder();
  }

  /* -----------------------------
     Open driver dialog
  ----------------------------- */

  protected openAssignDriver(): void {
    this.error.set(null);
    this.showAssignDriver.set(true);
  }

  /* -----------------------------
     Close driver dialog
  ----------------------------- */

  protected closeAssignDriver(): void {
    this.showAssignDriver.set(false);
  }

  /* -----------------------------
     Assign driver
  ----------------------------- */

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
          console.error('Driver assignment failed:', {
            status: err.status,
            url: err.url,
            backendError: err.error,
            message: err.error?.message,
            details: err.error?.error?.details,
          });

          const message =
            err?.error?.error?.details ||
            err?.error?.message ||
            err?.error?.error?.message ||
            'Unable to assign the driver. Please try again.';

          this.error.set(typeof message === 'string' ? message : JSON.stringify(message));
        },
      });
  }
  ///calculate distance
  /**
   * Calculate the distance between two GPS coordinates in kilometres.
   */
  protected calculateDistance(
    pickupLatitude?: number | null,
    pickupLongitude?: number | null,
    deliveryLatitude?: number | null,
    deliveryLongitude?: number | null,
  ): number | null {
    if (
      pickupLatitude == null ||
      pickupLongitude == null ||
      deliveryLatitude == null ||
      deliveryLongitude == null
    ) {
      return null;
    }

    const toRadians = (degrees: number): number => {
      return degrees * (Math.PI / 180);
    };

    const earthRadiusKm = 6371;

    const latitudeDifference = toRadians(deliveryLatitude - pickupLatitude);
    const longitudeDifference = toRadians(deliveryLongitude - pickupLongitude);

    const a =
      Math.sin(latitudeDifference / 2) ** 2 +
      Math.cos(toRadians(pickupLatitude)) *
        Math.cos(toRadians(deliveryLatitude)) *
        Math.sin(longitudeDifference / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }
}
