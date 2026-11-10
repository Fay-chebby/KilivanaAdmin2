import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pickup-station-status',
  standalone: true,
  templateUrl: './pickup-station-status.html',
  styleUrl: './pickup-station-status.scss',
})
export class PickupStationStatus {
  @Input() isAvailable = false;
}
