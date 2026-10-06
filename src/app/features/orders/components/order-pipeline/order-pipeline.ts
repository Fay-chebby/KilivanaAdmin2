import { Component, computed, input } from '@angular/core';
import { OrderStatus, PIPELINE } from '../../models/order.model';

@Component({
  selector: 'app-order-pipeline',
  templateUrl: './order-pipeline.html',
  styleUrl: './order-pipeline.scss',
})
export class OrderPipeline {
  readonly status = input.required<OrderStatus>();

  protected readonly steps = PIPELINE;

  protected readonly halted = computed(() => this.status() === 'cancelled');

  protected readonly finished = computed(() => this.status() === 'delivered');

  protected readonly currentIndex = computed(() => {
    return this.steps.indexOf(this.status());
  });

  protected isCompleted(index: number): boolean {
    return !this.halted() && index < this.currentIndex();
  }

  protected isCurrent(index: number): boolean {
    return index === this.currentIndex();
  }
}
