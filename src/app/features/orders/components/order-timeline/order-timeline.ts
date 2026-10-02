import { Component, input } from '@angular/core';
import { OrderEvent } from '../../models/order.model';

@Component({
  selector: 'app-order-timeline',
  templateUrl: './order-timeline.html',
  styleUrl: './order-timeline.scss',
})
export class OrderTimeline {
  readonly events = input.required<OrderEvent[]>();
  protected when(at: string) {
    return at.replace('T', ' ');
  }
}
