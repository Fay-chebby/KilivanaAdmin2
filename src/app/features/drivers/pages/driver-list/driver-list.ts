import { Component, computed, inject, linkedSignal, OnInit, signal } from '@angular/core';

import { RouterLink } from '@angular/router';

import { StatCard, StatTone } from '../../../../shared/components/stat-card/stat-card';

import { DriverActionDialog } from '../../components/driver-action-dialog/driver-action-dialog';
import { DriverFilters } from '../../components/driver-filters/driver-filters';
import { DriverStatusBadge } from '../../components/driver-status-badge/driver-status-badge';

import { Driver, DriverStatus, KENYA_COUNTIES } from '../../models/driver.model';

import { vehicleLabel } from '../../models/vehicle.model';

import { DriverService } from '../../services/driver.service';

type DialogState = {
  type: 'delete' | 'suspend' | 'activate';
  driver: Driver;
} | null;

@Component({
  selector: 'app-driver-list',
  imports: [RouterLink, StatCard, DriverFilters, DriverStatusBadge, DriverActionDialog],
  templateUrl: './driver-list.html',
  styleUrl: './driver-list.scss',
})
export class DriverList implements OnInit {
  readonly svc = inject(DriverService);

  readonly regions = KENYA_COUNTIES;
  readonly pageSize = 8;
  readonly notice = this.svc.notice;
  readonly vehicleLabel = vehicleLabel;

  readonly loading = signal(false);

  search = signal('');
  status = signal<'all' | DriverStatus>('all');
  region = signal('all');

  /**
   * Reset to page 1 whenever a filter changes.
   */
  page = linkedSignal({
    source: () => [this.search(), this.status(), this.region()],
    computation: () => 1,
  });

  dialog = signal<DialogState>(null);

  /**
   * Load drivers from Spring Boot when the page opens.
   */
  ngOnInit(): void {
    this.loadDrivers();
  }

  loadDrivers(): void {
    this.loading.set(true);

    this.svc.loadDrivers().subscribe({
      next: () => {
        this.loading.set(false);
      },

      error: (error) => {
        this.loading.set(false);

        console.error('Failed to load drivers:', error);
      },
    });
  }

  /**
   * Filter drivers according to search,
   * status and county.
   */
  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();

    return this.svc
      .drivers()
      .filter(
        (driver) =>
          (this.status() === 'all' || driver.status === this.status()) &&
          (this.region() === 'all' || driver.region === this.region()) &&
          (!q ||
            driver.fullName.toLowerCase().includes(q) ||
            driver.code.toLowerCase().includes(q) ||
            driver.username.toLowerCase().includes(q) ||
            driver.vehicle.plateNumber.toLowerCase().includes(q)),
      );
  });

  /**
   * Total number of pages.
   */
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  /**
   * Current page.
   */
  currentPage = computed(() => Math.min(this.page(), this.totalPages()));

  /**
   * Drivers displayed on the current page.
   */
  paged = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;

    return this.filtered().slice(start, start + this.pageSize);
  });

  /**
   * Driver statistics.
   */
  statCards = computed(() => {
    const all = this.svc.drivers();

    const count = (status: DriverStatus) => all.filter((driver) => driver.status === status).length;

    const totalDrivers = all.length;

    return [
      {
        key: 'on-delivery' as const,
        label: 'On Delivery',
        value: String(count('on-delivery')),
        icon: 'truck',
        tone: 'blue' as StatTone,
      },

      {
        key: 'available' as const,
        label: 'Available',
        value: String(count('available')),
        icon: 'check',
        tone: 'green' as StatTone,
      },

      {
        key: 'offline' as const,
        label: 'Offline',
        value: String(count('offline')),
        icon: 'ban',
        tone: 'amber' as StatTone,
      },

      {
        key: 'all' as const,
        label: 'Total Drivers',
        value: totalDrivers.toLocaleString(),
        icon: 'users',
        tone: 'blue' as StatTone,
      },
    ];
  });
  /**
   * Filter by a status card.
   */
  filterBy(key: 'all' | DriverStatus): void {
    this.status.set(this.status() === key ? 'all' : key);
  }

  /**
   * Move to a specific page.
   */
  go(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  /**
   * Generate initials for the driver avatar.
   */
  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  /**
   * Open confirmation dialog.
   */
  open(type: 'delete' | 'suspend' | 'activate', driver: Driver): void {
    this.dialog.set({
      type,
      driver,
    });
  }

  /**
   * Handle confirmation from the action dialog.
   */
  confirm(reason: string): void {
    const dialog = this.dialog();

    if (!dialog) {
      return;
    }

    const driver = dialog.driver;

    if (dialog.type === 'delete') {
      this.deleteDriver(driver);
      return;
    }

    /*
     * Suspend and activate are intentionally not
     * connected yet because their exact backend
     * request contracts have not been supplied.
     */

    if (dialog.type === 'suspend') {
      this.suspendDriver(driver, reason);
      return;
    }

    if (dialog.type === 'activate') {
      this.activateDriver(driver);
      return;
    }
  }

  /**
   * Delete driver through the backend.
   */
  private deleteDriver(driver: Driver): void {
    if (this.svc.isLocked(driver)) {
      return;
    }

    this.svc.delete(driver.id).subscribe({
      next: () => {
        this.dialog.set(null);
      },

      error: (error) => {
        console.error('Failed to delete driver:', error);

        this.dialog.set(null);
      },
    });
  }
  private suspendDriver(driver: Driver, reason: string): void {
    if (this.svc.isLocked(driver)) {
      return;
    }

    this.svc.suspend(driver.id, reason).subscribe({
      next: () => {
        this.dialog.set(null);
      },
      error: (error) => {
        console.error('Failed to suspend driver:', error);
        this.dialog.set(null);
      },
    });
  }
  //activate
  private activateDriver(driver: Driver): void {
    this.svc.unsuspend(driver.id).subscribe({
      next: () => {
        this.dialog.set(null);
      },
      error: (error) => {
        console.error('Failed to activate driver:', error);
        this.dialog.set(null);
      },
    });
  }
}
