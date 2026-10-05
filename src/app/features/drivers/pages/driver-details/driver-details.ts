import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DriverActionDialog } from '../../components/driver-action-dialog/driver-action-dialog';
import { DriverStatusBadge } from '../../components/driver-status-badge/driver-status-badge';
import { VehicleInfoCard } from '../../components/vehicle-info-card/vehicle-info-card';
import { DriverService } from '../../services/driver.service';

@Component({
  selector: 'app-driver-details',
  imports: [RouterLink, DriverStatusBadge, VehicleInfoCard, DriverActionDialog],
  templateUrl: './driver-details.html',
  styleUrl: './driver-details.scss',
})
export class DriverDetails implements OnInit {
  readonly svc = inject(DriverService);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /**
   * Backend driver IDs are Long values, therefore number on the frontend.
   *
   * The route parameter is originally a string, so convert it to number.
   */
  readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly dialog = signal<'delete' | 'suspend' | 'activate' | null>(null);

  readonly notice = this.svc.notice;

  readonly driver = computed(() => {
    return this.svc.drivers().find((d) => d.id === this.id) ?? null;
  });

  readonly licenceExpired = computed(() => {
    const d = this.driver();

    if (!d) {
      return false;
    }

    return new Date(d.licenceExpiry) < new Date();
  });

  ngOnInit(): void {
    this.loadDriver();
  }

  private loadDriver(): void {
    if (!Number.isFinite(this.id)) {
      return;
    }

    this.svc.getById(this.id).subscribe({
      next: (response) => {
        const driver = this.svc.mapApiDriver(response.data);

        this.svc.setDriver(driver);
      },

      error: (error) => {
        console.error('Failed to load driver details:', error);
      },
    });
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  toggleKyc(): void {
    /*
     * KYC update endpoint/request schema has not been provided yet.
     *
     * Do not call the old setKyc() local-storage method.
     */
    console.warn('KYC update requires the backend KYC endpoint contract.');
  }

  open(type: 'delete' | 'suspend' | 'activate'): void {
    this.dialog.set(type);
  }

  confirm(reason: string): void {
    const type = this.dialog();

    if (!type) {
      return;
    }

    this.dialog.set(null);

    /*
     * Delete is supported by the confirmed backend contract.
     */
    if (type === 'delete') {
      this.svc.delete(this.id).subscribe({
        next: () => {
          this.router.navigate(['/drivers']);
        },

        error: (error) => {
          console.error('Failed to delete driver:', error);
        },
      });

      return;
    }

    /*
     * Suspend/activate endpoints have not yet been supplied
     * with their exact request/response contracts.
     *
     * Keep these disabled until we confirm the backend API.
     */
    if (type === 'suspend') {
      console.warn('Driver suspension requires the backend status endpoint contract.', reason);
      return;
    }

    if (type === 'activate') {
      console.warn('Driver activation requires the backend status endpoint contract.');
    }
  }
}
