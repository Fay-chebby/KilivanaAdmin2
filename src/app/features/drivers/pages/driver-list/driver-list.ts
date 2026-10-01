import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatCard, StatTone } from '../../../../shared/components/stat-card/stat-card';
import { DriverActionDialog } from '../../components/driver-action-dialog/driver-action-dialog';
import { DriverFilters } from '../../components/driver-filters/driver-filters';
import { DriverStatusBadge } from '../../components/driver-status-badge/driver-status-badge';
import { Driver, DriverStatus, GHANA_REGIONS } from '../../models/driver.model';
import { vehicleLabel } from '../../models/vehicle.model';
import { DriverService } from '../../services/driver.service';

type DialogState = { type: 'delete' | 'suspend' | 'activate'; driver: Driver } | null;

@Component({
  selector: 'app-driver-list',
  imports: [RouterLink, StatCard, DriverFilters, DriverStatusBadge, DriverActionDialog],
  templateUrl: './driver-list.html',
  styleUrl: './driver-list.scss',
})
export class DriverList {
  readonly svc = inject(DriverService);

  readonly regions = GHANA_REGIONS;
  readonly pageSize = 8;
  readonly notice = this.svc.notice;
  readonly vehicleLabel = vehicleLabel;

  search = signal('');
  status = signal<'all' | DriverStatus>('all');
  region = signal('all');
  /** resets to page 1 whenever a filter changes */
  page = linkedSignal({
    source: () => [this.search(), this.status(), this.region()],
    computation: () => 1,
  });
  dialog = signal<DialogState>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.svc
      .drivers()
      .filter(
        (d) =>
          (this.status() === 'all' || d.status === this.status()) &&
          (this.region() === 'all' || d.region === this.region()) &&
          (!q ||
            d.fullName.toLowerCase().includes(q) ||
            d.code.toLowerCase().includes(q) ||
            d.username.toLowerCase().includes(q) ||
            d.vehicle.plateNumber.toLowerCase().includes(q)),
      );
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  paged = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  /** Change the icon names below to match your Icon component's names */
  statCards = computed(() => {
    const all = this.svc.drivers();
    const count = (s: DriverStatus) => all.filter((d) => d.status === s).length;
    const total = all.reduce((sum, d) => sum + d.totalDeliveries, 0);
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
        label: 'Total Deliveries',
        value: total.toLocaleString(),
        icon: 'box',
        tone: 'blue' as StatTone,
      },
    ];
  });

  filterBy(key: 'all' | DriverStatus) {
    this.status.set(this.status() === key ? 'all' : key);
  }

  go(p: number) {
    this.page.set(Math.min(Math.max(1, p), this.totalPages()));
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  open(type: 'delete' | 'suspend' | 'activate', driver: Driver) {
    this.dialog.set({ type, driver });
  }

  confirm(reason: string) {
    const d = this.dialog();
    if (!d) return;
    if (d.type === 'delete') this.svc.delete(d.driver.id);
    if (d.type === 'suspend') this.svc.suspend(d.driver.id, reason);
    if (d.type === 'activate') this.svc.activate(d.driver.id);
    this.dialog.set(null);
  }
}
