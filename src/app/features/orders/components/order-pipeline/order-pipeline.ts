import { Component, computed, input, output } from '@angular/core';
import { OrderStatus, PIPELINE } from '../../models/order.model';

@Component({
  selector: 'app-order-pipeline',
  templateUrl: './order-pipeline.html',
  styleUrl: './order-pipeline.scss',
})
export class OrderPipeline {
  readonly status = input.required<OrderStatus>();
  readonly busy = input(false);
  readonly driverAssigned = input(false);

  readonly statusChange = output<OrderStatus>();
  readonly assignDriverRequested = output<void>();

  protected readonly steps = PIPELINE;

  protected readonly currentIndex = computed(() => {
    const index = this.steps.indexOf(this.status() as (typeof this.steps)[number]);
    return Math.max(0, index);
  });

  protected readonly isCancelled = computed(() => this.status() === 'CANCELLED');

  protected readonly isDisputed = computed(() => this.status() === 'DISPUTED');

  protected canSelectStatus(step: OrderStatus): boolean {
    if (this.busy() || step === this.status()) return false;

    if (step === 'IN_TRANSIT' && !this.driverAssigned()) {
      return false;
    }

    const targetIndex = this.steps.indexOf(step as (typeof this.steps)[number]);

    return targetIndex === this.currentIndex() + 1;
  }

  protected changeStatus(step: OrderStatus): void {
    if (this.canSelectStatus(step)) {
      this.statusChange.emit(step);
    }
  }

  protected requestDriverAssignment(): void {
    console.log('Assign Driver clicked');

    if (!this.busy() && !this.driverAssigned()) {
      this.assignDriverRequested.emit();
    }
  }
}
