import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PickupStationService } from '../../services/pickup-station.service';
import { PickupStation } from '../../models/pickup-station.model';
import { PickupStationStatus } from '../../components/pickup-station-status/pickup-station-status';

@Component({
  selector: 'app-pickup-station-list',
  standalone: true,
  imports: [RouterLink, PickupStationStatus],
  templateUrl: './pickup-station-list.html',
  styleUrl: './pickup-station-list.scss',
})
export class PickupStationList implements OnInit {
  private readonly pickupStationService = inject(PickupStationService);

  // Page state
  stations = signal<PickupStation[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  searchTerm = signal('');
  deactivatingId = signal<number | null>(null);

  // Filter stations based on search input
  filteredStations = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();

    if (!search) {
      return this.stations();
    }

    return this.stations().filter(
      (station) =>
        station.name?.toLowerCase().includes(search) ||
        station.region?.toLowerCase().includes(search) ||
        station.address?.toLowerCase().includes(search) ||
        station.contactPhone?.toLowerCase().includes(search),
    );
  });

  // Statistics
  totalStations = computed(() => this.stations().length);

  availableStations = computed(
    () => this.stations().filter((station) => station.isAvailable).length,
  );

  unavailableStations = computed(
    () => this.stations().filter((station) => !station.isAvailable).length,
  );

  ngOnInit(): void {
    this.loadStations();
  }

  // Fetch all pickup stations
  loadStations(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.pickupStationService.getAll().subscribe({
      next: (stations) => {
        this.stations.set(stations ?? []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load pickup stations:', error);

        this.errorMessage.set(
          error?.error?.error?.details ||
            error?.error?.message ||
            'Unable to load pickup stations. Please try again.',
        );

        this.isLoading.set(false);
      },
    });
  }

  // Update search
  onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  // Clear search
  clearSearch(): void {
    this.searchTerm.set('');
  }

  // Deactivate station
  deactivateStation(station: PickupStation): void {
    if (this.deactivatingId() !== null || !station.isAvailable) {
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to deactivate "${station.name}"?`);

    if (!confirmed) {
      return;
    }

    this.deactivatingId.set(station.id);
    this.errorMessage.set('');

    this.pickupStationService.deactivate(station.id).subscribe({
      next: () => {
        this.deactivatingId.set(null);

        // Update the station locally after successful deactivation.
        this.stations.update((current) =>
          current.map((item) => (item.id === station.id ? { ...item, isAvailable: false } : item)),
        );
      },
      error: (error) => {
        console.error('Failed to deactivate station:', error);

        this.errorMessage.set(
          error?.error?.error?.details ||
            error?.error?.message ||
            'Unable to deactivate pickup station.',
        );

        this.deactivatingId.set(null);
      },
    });
  }
}
