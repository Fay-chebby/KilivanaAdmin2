import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DriverForm } from '../../components/driver-form/driver-form';
import { DriverFormValue } from '../../models/driver.model';
import { DriverService } from '../../services/driver.service';

@Component({
  selector: 'app-add-driver',
  imports: [RouterLink, DriverForm],
  templateUrl: './add-driver.html',
  styleUrl: './add-driver.scss',
})
export class AddDriver {
  private readonly svc = inject(DriverService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  save(value: DriverFormValue): void {
    this.saving.set(true);
    this.errorMessage.set(null);

    this.svc.create(value).subscribe({
      next: (response) => {
        console.log('Driver registered successfully:', response);

        this.saving.set(false);

        // Go back to the driver list after successful registration
        this.router.navigate(['/drivers']);
      },

      error: (error) => {
        console.error('Failed to register driver:', error);

        this.saving.set(false);

        if (error.status === 0) {
          this.errorMessage.set(
            'Unable to connect to the backend. Check the server, ngrok, or CORS configuration.',
          );
        } else if (error.status === 400) {
          this.errorMessage.set(error.error?.message || 'The driver information is invalid.');
        } else if (error.status === 401) {
          this.errorMessage.set(
            'Your session has expired or you are not authorized to register drivers.',
          );
        } else if (error.status === 403) {
          this.errorMessage.set('You do not have permission to register a driver.');
        } else {
          this.errorMessage.set(
            error.error?.message || 'Failed to register driver. Please try again.',
          );
        }
      },
    });
  }
  cancel(): void {
    this.router.navigate(['/drivers']);
  }
}
