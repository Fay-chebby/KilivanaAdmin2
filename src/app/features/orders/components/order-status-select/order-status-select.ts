import { Component, input, output } from '@angular/core';
import { OrderStatus, STATUS_OPTIONS } from '../../models/order.model';

export type OrderStatusFilter = OrderStatus | 'ALL';

@Component({
  selector: 'app-order-status-select',
  standalone: true,
  templateUrl: './order-status-select.html',
  styleUrl: './order-status-select.scss',
})
export class OrderStatusSelect {
  readonly status = input.required<OrderStatusFilter>();

  readonly changed = output<OrderStatusFilter>();

  protected readonly options = [{ label: 'All orders', value: 'ALL' as const }, ...STATUS_OPTIONS];

  protected changeStatus(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    this.changed.emit(value as OrderStatusFilter);
  }
}
