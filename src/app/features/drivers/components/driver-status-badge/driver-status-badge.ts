import { Component, computed, input } from '@angular/core';
import { DriverStatus } from '../../models/driver.model';

const LABELS: Record<DriverStatus, string> = {
  'on-delivery': 'On Delivery',
  available: 'Available',
  offline: 'Offline',
  suspended: 'Suspended',
};

@Component({
  selector: 'app-driver-status-badge',
  templateUrl: './driver-status-badge.html',
  styleUrl: './driver-status-badge.scss',
})
export class DriverStatusBadge {
  status = input.required<DriverStatus>();
  label = computed(() => LABELS[this.status()]);
}
