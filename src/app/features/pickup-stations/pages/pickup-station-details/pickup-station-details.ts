import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { PickupStation } from '../../models/pickup-station.model';
import { PickupStationService } from '../../services/pickup-station.service';
import { PickupStationMap } from '../../components/pickup-station-map/pickup-station-map';
import { PickupStationStatus } from '../../components/pickup-station-status/pickup-station-status';

@Component({
  selector: 'app-pickup-station-details',
  standalone: true,
  imports: [RouterLink, DatePipe, PickupStationMap, PickupStationStatus],
  templateUrl: './pickup-station-details.html',
  styleUrl: './pickup-station-details.scss',
})
export class PickupStationDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pickupStationService = inject(PickupStationService);

  station = signal<PickupStation | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('Invalid pickup station ID.');
      this.isLoading.set(false);
      return;
    }

    this.loadStation(id);
  }

  loadStation(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.pickupStationService.getById(id).subscribe({
      next: (station) => {
        this.station.set(station);
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

  editStation(): void {
    const station = this.station();

    if (station) {
      this.router.navigate(['/pickup-stations', station.id, 'edit']);
    }
  }

  deactivateStation(): void {
    const station = this.station();

    if (!station) {
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to deactivate "${station.name}"?`);

    if (!confirmed) {
      return;
    }

    this.pickupStationService.deactivate(station.id).subscribe({
      next: () => {
        this.router.navigate(['/pickup-stations']);
      },
      error: (error) => {
        console.error('Failed to deactivate station:', error);

        this.errorMessage.set(
          error?.error?.error?.details ||
            error?.error?.message ||
            'Unable to deactivate pickup station.',
        );
      },
    });
  }
}
