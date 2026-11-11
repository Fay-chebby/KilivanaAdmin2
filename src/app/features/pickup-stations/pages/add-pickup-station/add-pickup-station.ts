import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PickupStationService } from '../../services/pickup-station.service';
import { PickupStationRequest } from '../../models/pickup-station.model';

@Component({
  selector: 'app-add-pickup-station',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './add-pickup-station.html',
  styleUrl: './add-pickup-station.scss',
})
export class AddPickupStation {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly pickupStationService = inject(PickupStationService);

  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  pickupStationForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    address: ['', Validators.required],
    latitude: [0, Validators.required],
    longitude: [0, Validators.required],
    region: ['', Validators.required],
    isAvailable: [true],
    openingHours: [''],
    contactPhone: [''],
    pickupInstructions: [''],
  });

  submit(): void {
    if (this.pickupStationForm.invalid) {
      this.pickupStationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const payload: PickupStationRequest = this.pickupStationForm.getRawValue();

    this.pickupStationService.create(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Pickup station created successfully.');

        this.router.navigate(['/Pickup-Sation']);
      },
      error: (error) => {
        console.error('Failed to create pickup station:', error);

        this.errorMessage.set(
          error?.error?.error?.details ||
            error?.error?.message ||
            'Failed to create pickup station. Please try again.',
        );

        this.isSubmitting.set(false);
      },
    });
  }

  get name() {
    return this.pickupStationForm.controls.name;
  }

  get address() {
    return this.pickupStationForm.controls.address;
  }

  get latitude() {
    return this.pickupStationForm.controls.latitude;
  }

  get longitude() {
    return this.pickupStationForm.controls.longitude;
  }

  get region() {
    return this.pickupStationForm.controls.region;
  }

  cancel(): void {
    this.router.navigate(['/pickup-stations']);
  }
}
