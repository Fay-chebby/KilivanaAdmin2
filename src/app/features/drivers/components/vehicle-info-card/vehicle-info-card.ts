import { Component, input } from '@angular/core';
import { Vehicle } from '../../models/vehicle.model';

@Component({
  selector: 'app-vehicle-info-card',
  templateUrl: './vehicle-info-card.html',
  styleUrl: './vehicle-info-card.scss',
})
export class VehicleInfoCard {
  vehicle = input.required<Vehicle>();
}
