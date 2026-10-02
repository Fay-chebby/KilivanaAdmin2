import { Component, input, output } from '@angular/core';
import { ORDER_STATUS_META, STATUS_OPTIONS } from '../../models/order.model';

@Component({
  selector: 'app-order-status-select',
  templateUrl: './order-status-select.html',
  styleUrl: './order-status-select.scss',
})
export class OrderStatusSelect {
  readonly value = input('');
  readonly changed = output<string>();
  protected readonly options = STATUS_OPTIONS;
  protected readonly meta = ORDER_STATUS_META;
}
