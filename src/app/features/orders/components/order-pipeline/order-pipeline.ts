import { Component, computed, input } from '@angular/core';
import { OrderStatus, PIPELINE } from '../../models/order.model';

@Component({
  selector: 'app-order-pipeline',
  templateUrl: './order-pipeline.html',
  styleUrl: './order-pipeline.scss',
})
export class OrderPipeline {
  readonly progress = input.required<number>();
  readonly status = input.required<OrderStatus>();

  protected readonly steps = PIPELINE;
  protected readonly halted = computed(
    () => this.status() === 'disputed' || this.status() === 'cancelled',
  );
  protected readonly finished = computed(() => this.status() === 'completed');
}
