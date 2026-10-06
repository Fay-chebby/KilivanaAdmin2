import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DriverForm } from '../../components/driver-form/driver-form';
import { DriverService } from '../../services/driver.service';
import { DriverFormValue, Driver } from '../../models/driver.model';

@Component({
  selector: 'app-edit-driver',
  standalone: true,
  imports: [DriverForm],
  templateUrl: './edit-driver.html',
  styleUrl: './edit-driver.scss',
})
export class EditDriver implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly driverService = inject(DriverService);

  readonly driver = signal<Driver | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  private driverId!: number;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('Invalid driver ID.');
      this.loading.set(false);
      return;
    }

    this.driverId = id;

    this.loadDriver();
  }

  // ============================================================
  // LOAD DRIVER
  // ============================================================

  private loadDriver(): void {
    this.loading.set(true);
    this.error.set(null);

    this.driverService.getById(this.driverId).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.error.set(response.message || 'Failed to load driver.');

          this.loading.set(false);
          return;
        }

        const driver = this.driverService.mapApiDriver(response.data);

        this.driver.set(driver);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Failed to load driver:', error);

        this.error.set(error?.error?.message || error?.message || 'Failed to load driver.');

        this.loading.set(false);
      },
    });
  }

  // ============================================================
  // SAVE DRIVER
  // ============================================================

  save(value: DriverFormValue): void {
    const driver = this.driver();

    if (!driver) {
      this.error.set('Driver information is not available.');
      return;
    }

    // Driver.id is mapped from backend userId
    const userId = Number(driver.id);

    console.log('Updating driver with userId:', userId);

    console.log('Driver:', driver);

    if (!Number.isInteger(userId) || userId <= 0) {
      this.error.set('Invalid driver user ID.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.driverService.update(userId, value).subscribe({
      next: (response) => {
        this.saving.set(false);

        if (!response.success || !response.data) {
          this.error.set(response.message || 'Failed to update driver.');
          return;
        }

        /*
         * The update endpoint returns a DRIVER PROFILE,
         * not the complete admin driver object.
         *
         * Therefore we do not pass response.data
         * through mapApiDriver().
         */

        this.router.navigate(['/drivers']);
      },

      error: (error) => {
        console.error('Failed to update driver:', error);

        this.saving.set(false);

        this.error.set(error?.error?.message || error?.message || 'Failed to update driver.');
      },
    });
  }

  // ============================================================
  // CANCEL
  // ============================================================

  cancel(): void {
    this.router.navigate(['/drivers']);
  }
}
