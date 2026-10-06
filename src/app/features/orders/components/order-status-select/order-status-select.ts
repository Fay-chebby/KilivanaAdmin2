import { Component, input, output } from '@angular/core';
import { OrderStatus, STATUS_OPTIONS } from '../../models/order.model';

@Component({
  selector: 'app-order-status-select',
  templateUrl: './order-status-select.html',
  styleUrl: './order-status-select.scss',
})
export class OrderStatusSelect {
  readonly status = input.required<OrderStatus>();

  readonly changed = output<OrderStatus>();

  protected readonly options = STATUS_OPTIONS;

  protected changeStatus(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    this.changed.emit(value as OrderStatus);
  }
}
