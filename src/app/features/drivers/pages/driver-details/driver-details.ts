import { Component, computed, inject, signal } from '@angular/core';
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
export class DriverDetails {
  readonly svc = inject(DriverService);
  private router = inject(Router);
  private id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  dialog = signal<'delete' | 'suspend' | 'activate' | null>(null);
  driver = computed(() => this.svc.drivers().find((d) => d.id === this.id) ?? null);
  notice = this.svc.notice;
  licenceExpired = computed(() => {
    const d = this.driver();
    return !!d && new Date(d.licenceExpiry) < new Date();
  });

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  toggleKyc() {
    const d = this.driver();
    if (d) this.svc.setKyc(d.id, d.kycStatus === 'verified' ? 'pending' : 'verified');
  }

  confirm(reason: string) {
    const type = this.dialog();
    this.dialog.set(null);
    if (type === 'suspend') this.svc.suspend(this.id, reason);
    if (type === 'activate') this.svc.activate(this.id);
    if (type === 'delete' && this.svc.delete(this.id)) this.router.navigate(['/drivers']);
  }
}
