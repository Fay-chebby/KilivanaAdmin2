import { Component, inject, OnInit } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DriverForm } from '../../components/driver-form/driver-form';

import { Driver, DriverFormValue } from '../../models/driver.model';

import { DriverService } from '../../services/driver.service';

@Component({
  selector: 'app-edit-driver',
  imports: [RouterLink, DriverForm],
  templateUrl: './edit-driver.html',
  styleUrl: './edit-driver.scss',
})
export class EditDriver implements OnInit {
  private readonly svc = inject(DriverService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /**
   * Driver ID from the URL.
   *
   * Angular route parameters are strings,
   * while the backend uses Long/numeric IDs.
   */
  readonly id = Number(this.route.snapshot.paramMap.get('id'));

  /**
   * Driver loaded from the backend.
   *
   * This is intentionally a normal property because
   * the existing HTML expects `driver`, not `driver()`.
   */
  driver: Driver | null = null;

  loading = true;
  saving = false;

  ngOnInit(): void {
    this.loadDriver();
  }

  /**
   * Load the driver from Spring Boot.
   */
  private loadDriver(): void {
    if (!Number.isFinite(this.id)) {
      this.loading = false;
      return;
    }

    this.svc.getById(this.id).subscribe({
      next: (response) => {
        this.driver = this.svc.mapApiDriver(response.data);

        this.loading = false;
      },

      error: (error) => {
        console.error('Failed to load driver:', error);

        this.loading = false;
      },
    });
  }

  /**
   * Save driver changes.
   *
   * The backend has PUT /api/v1/admin/users/{id},
   * but its exact request schema has not yet been
   * provided, so we do not send a guessed request.
   */
  save(value: DriverFormValue): void {
    if (!this.driver) {
      return;
    }

    console.log('Driver update data:', value);

    console.warn('Driver update endpoint still needs its exact request schema.');
  }

  /**
   * Return to the driver list.
   */
  cancel(): void {
    this.router.navigate(['/drivers']);
  }
}
