import { Component, computed, inject, input, output, signal } from '@angular/core';

import { Order } from '../../models/order.model';
import { DeliveryService } from '../../../logistics/services/delivery.service';

@Component({
  selector: 'app-assign-driver-dialog',
  templateUrl: './assign-driver-dialog.html',
  styleUrl: './assign-driver-dialog.scss',
})
export class AssignDriverDialog {
  private readonly deliveryService = inject(DeliveryService);

  readonly order = input.required<Order>();

  readonly assigned = output<string>();

  readonly cancelled = output<void>();

  protected readonly selected = signal<string | null>(null);

  protected readonly options = computed(() =>
    this.deliveryService.drivers.map((driver) => ({
      a: driver,
    })),
  );

  protected selectDriver(driverId: string): void {
    this.selected.set(driverId);
  }

  protected confirm(): void {
    const driverId = this.selected();

    if (!driverId) {
      return;
    }

    this.assigned.emit(driverId);
  }

  protected cancel(): void {
    this.cancelled.emit();
  }
}
