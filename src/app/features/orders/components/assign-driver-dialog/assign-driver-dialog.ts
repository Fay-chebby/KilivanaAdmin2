import { Component, computed, inject, input, output, signal, OnInit } from '@angular/core';

import { Order } from '../../models/order.model';
import { DriverService } from '../../../drivers/services/driver.service';
import { Driver } from '../../../drivers/models/driver.model';

@Component({
  selector: 'app-assign-driver-dialog',
  templateUrl: './assign-driver-dialog.html',
  styleUrl: './assign-driver-dialog.scss',
})
export class AssignDriverDialog implements OnInit {
  private readonly driverService = inject(DriverService);

  readonly order = input.required<Order>();

  readonly assigned = output<number>();
  readonly cancelled = output<void>();

  protected readonly selected = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly options = computed(() => {
    return this.driverService
      .drivers()
      .filter(
        (driver: Driver) =>
          Number.isSafeInteger(driver.id) && driver.id > 0 && driver.status === 'available',
      )
      .map((driver) => ({
        id: driver.id,
        driver,
      }));
  });

  ngOnInit(): void {
    // Reuse the existing driver list when it is already loaded.
    if (this.driverService.drivers().length > 0) {
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);

    this.driverService.loadDrivers().subscribe({
      next: (response) => {
        if (!response.success) {
          this.loadError.set(response.message || 'Could not load drivers.');
        }
      },
      error: (error) => {
        console.error('Failed to load drivers:', error);

        this.loadError.set(error?.error?.message || 'Unable to load drivers. Please try again.');
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  protected selectDriver(driverId: number): void {
    if (Number.isSafeInteger(driverId) && driverId > 0) {
      this.selected.set(driverId);
    }
  }

  protected confirm(): void {
    const driverId = this.selected();

    if (driverId === null || this.loading()) {
      return;
    }

    this.assigned.emit(driverId);
  }

  protected cancel(): void {
    this.cancelled.emit();
  }
}
