import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DriverActionDialog } from '../../components/driver-action-dialog/driver-action-dialog';
import { DriverStatusBadge } from '../../components/driver-status-badge/driver-status-badge';
import { VehicleInfoCard } from '../../components/vehicle-info-card/vehicle-info-card';
import { DriverService } from '../../services/driver.service';
import { DriverJob } from '../../models/driver.model';

@Component({
  selector: 'app-driver-details',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    DriverStatusBadge,
    VehicleInfoCard,
    DriverActionDialog,
  ],
  templateUrl: './driver-details.html',
  styleUrl: './driver-details.scss',
})
export class DriverDetails implements OnInit {
  readonly svc = inject(DriverService);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Read the driver ID from the route.
  readonly id = Number(this.route.snapshot.paramMap.get('id'));

  // Dialog state.
  readonly dialog = signal<'delete' | 'suspend' | 'activate' | null>(null);

  // Notifications from DriverService.
  readonly notice = this.svc.notice;

  // Driver details.
  readonly driver = computed(() => this.svc.drivers().find((d) => d.id === this.id) ?? null);

  // Driver delivery jobs.
  readonly jobs = signal<DriverJob[]>([]);
  readonly jobsLoading = signal(false);
  readonly jobsError = signal<string | null>(null);

  // Licence expiry.
  readonly licenceExpired = computed(() => {
    const driver = this.driver();

    if (!driver?.licenceExpiry) {
      return false;
    }

    const expiry = new Date(driver.licenceExpiry);

    return !Number.isNaN(expiry.getTime()) && expiry < new Date();
  });

  // Pending jobs.
  readonly pendingJobs = computed(
    () =>
      this.jobs().filter((job) =>
        ['PENDING_ASSIGNMENT', 'ASSIGNED', 'PENDING'].includes(job.status?.toUpperCase()),
      ).length,
  );

  // Jobs currently being handled.
  readonly activeJobs = computed(
    () =>
      this.jobs().filter((job) =>
        ['ACCEPTED', 'IN_PROGRESS', 'PICKED_UP'].includes(job.status?.toUpperCase()),
      ).length,
  );

  // Completed jobs.
  readonly completedJobs = computed(
    () =>
      this.jobs().filter((job) => ['COMPLETED', 'DELIVERED'].includes(job.status?.toUpperCase()))
        .length,
  );

  ngOnInit(): void {
    if (!Number.isInteger(this.id) || this.id <= 0) {
      this.router.navigate(['/drivers']);
      return;
    }

    this.loadDriver();
    this.loadDriverJobs();
  }

  // Fetch driver details.
  private loadDriver(): void {
    this.svc.getById(this.id).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          console.error('Driver details were not returned by the API.');
          return;
        }

        const driver = this.svc.mapApiDriver(response.data);
        this.svc.setDriver(driver);
      },

      error: (error) => {
        console.error('Failed to load driver details:', error);
      },
    });
  }

  // Fetch jobs assigned to this driver.
  loadDriverJobs(): void {
    this.jobsLoading.set(true);
    this.jobsError.set(null);

    this.svc.getJobsByDriver(this.id).subscribe({
      next: (response) => {
        if (!response.success) {
          this.jobs.set([]);
          this.jobsError.set(response.message || 'Failed to load delivery jobs.');
          this.jobsLoading.set(false);
          return;
        }

        this.jobs.set(response.data ?? []);
        this.jobsLoading.set(false);
      },

      error: (error) => {
        console.error('Failed to load driver jobs:', error);

        this.jobsError.set('Could not load this driver’s orders.');
        this.jobsLoading.set(false);
      },
    });
  }

  // Generate initials for the driver avatar.
  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  // KYC update still requires a confirmed backend endpoint.
  toggleKyc(): void {
    console.warn('KYC update requires the backend KYC endpoint contract.');
  }

  open(type: 'delete' | 'suspend' | 'activate'): void {
    this.dialog.set(type);
  }

  // Handle confirmation from the action dialog.
  confirm(reason: string): void {
    const type = this.dialog();

    if (!type) {
      return;
    }

    this.dialog.set(null);

    if (type === 'delete') {
      this.svc.delete(this.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/drivers']);
          }
        },

        error: (error) => {
          console.error('Failed to delete driver:', error);
        },
      });

      return;
    }

    if (type === 'suspend') {
      this.svc.suspend(this.id, reason).subscribe({
        error: (error) => {
          console.error('Failed to suspend driver:', error);
        },
      });

      return;
    }

    if (type === 'activate') {
      this.svc.unsuspend(this.id).subscribe({
        error: (error) => {
          console.error('Failed to reinstate driver:', error);
        },
      });
    }
  }
}
