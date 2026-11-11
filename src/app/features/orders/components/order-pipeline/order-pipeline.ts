import { Component, computed, input, output } from '@angular/core';
import { OrderStatus, PIPELINE } from '../../models/order.model';

@Component({
  selector: 'app-order-pipeline',
  templateUrl: './order-pipeline.html',
  styleUrl: './order-pipeline.scss',
})
export class OrderPipeline {
  // Inputs
  readonly status = input.required<OrderStatus>();
  readonly busy = input(false);
  readonly driverAssigned = input(false);

  // Outputs
  readonly statusChange = output<OrderStatus>();
  readonly assignDriverRequested = output<void>();

  // Order pipeline steps
  protected readonly steps = PIPELINE;

  // Current order status index
  protected readonly currentIndex = computed(() => {
    const currentStatus = String(this.status()).trim().toUpperCase();

    const index = this.steps.indexOf(currentStatus as OrderStatus);

    console.log('Backend order status:', this.status());
    console.log('Normalized status:', currentStatus);
    console.log('Pipeline:', this.steps);
    console.log('Current index:', index);

    return index;
  });
  // Check whether order is cancelled
  protected readonly isCancelled = computed(() => this.status() === 'CANCELLED');

  // Check whether order is disputed
  protected readonly isDisputed = computed(() => this.status() === 'DISPUTED');

  // Check whether a status can be selected
  protected canSelectStatus(step: OrderStatus): boolean {
    // Prevent changes while processing
    if (this.busy() || step === this.status()) {
      return false;
    }

    // Driver must be assigned before IN_TRANSIT
    if (step === 'IN_TRANSIT' && !this.driverAssigned()) {
      return false;
    }

    // Only allow the next sequential status
    const targetIndex = this.steps.indexOf(step as (typeof this.steps)[number]);

    return targetIndex === this.currentIndex() + 1;
  }

  // Change order status
  protected changeStatus(step: OrderStatus): void {
    if (this.canSelectStatus(step)) {
      this.statusChange.emit(step);
    }
  }

  // Request driver assignment
  protected requestDriverAssignment(): void {
    if (this.busy() || this.driverAssigned()) {
      return;
    }

    this.assignDriverRequested.emit();
  }
}
