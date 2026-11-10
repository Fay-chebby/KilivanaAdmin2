import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PickupStationService } from '../../services/pickup-station.service';
import { PickupStationRequest } from '../../models/pickup-station.model';
import { PickupStationForm } from '../../components/pickup-station-form/pickup-station-form';

@Component({
  selector: 'app-edit-pickup-station',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, PickupStationForm],
  templateUrl: './edit-pickup-station.html',
  styleUrl: './edit-pickup-station.scss',
})
export class EditPickupStation {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pickupStationService = inject(PickupStationService);

  stationId = 0;

  isLoading = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal('');

  pickupStationForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    address: ['', Validators.required],
    latitude: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [0, [Validators.required, Validators.min(-180), Validators.max(180)]],
    region: ['', Validators.required],
    isAvailable: [true],
    openingHours: [''],
    contactPhone: [''],
    pickupInstructions: [''],
  });

  ngOnInit(): void {
    this.stationId = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(this.stationId) || this.stationId <= 0) {
      this.errorMessage.set('Invalid pickup station ID.');
      this.isLoading.set(false);
      return;
    }

    this.loadStation();
  }

  loadStation(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.pickupStationService.getById(this.stationId).subscribe({
      next: (station) => {
        this.pickupStationForm.patchValue({
          name: station.name,
          address: station.address,
          latitude: station.latitude,
          longitude: station.longitude,
          region: station.region,
          isAvailable: station.isAvailable,
          openingHours: station.openingHours ?? '',
          contactPhone: station.contactPhone ?? '',
          pickupInstructions: station.pickupInstructions ?? '',
        });

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load pickup station:', error);

        this.errorMessage.set(
          error?.error?.error?.details ||
            error?.error?.message ||
            'Unable to load pickup station details.',
        );

        this.isLoading.set(false);
      },
    });
  }

  updateStation(): void {
    if (this.pickupStationForm.invalid) {
      this.pickupStationForm.markAllAsTouched();
      return;
    }

    const payload: PickupStationRequest = this.pickupStationForm.getRawValue();

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.pickupStationService.update(this.stationId, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/pickup-stations', this.stationId]);
      },
      error: (error) => {
        console.error('Failed to update pickup station:', error);

        this.errorMessage.set(
          error?.error?.error?.details ||
            error?.error?.message ||
            'Unable to update pickup station. Please try again.',
        );

        this.isSubmitting.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/pickup-stations', this.stationId]);
  }
}
