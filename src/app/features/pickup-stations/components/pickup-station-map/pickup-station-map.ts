import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pickup-station-map',
  standalone: true,
  templateUrl: './pickup-station-map.html',
  styleUrl: './pickup-station-map.scss',
})
export class PickupStationMap {
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Input() address = '';

  get hasCoordinates(): boolean {
    return (
      this.latitude !== null &&
      this.longitude !== null &&
      Number.isFinite(this.latitude) &&
      Number.isFinite(this.longitude) &&
      this.latitude >= -90 &&
      this.latitude <= 90 &&
      this.longitude >= -180 &&
      this.longitude <= 180
    );
  }

  get googleMapsUrl(): string {
    if (!this.hasCoordinates) {
      return '';
    }

    return `https://www.google.com/maps?q=${this.latitude},${this.longitude}`;
  }
}
