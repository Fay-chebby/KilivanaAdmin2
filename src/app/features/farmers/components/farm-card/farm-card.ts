import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FarmerFarm } from '../../models/farmer.model';
import { FarmerBadge } from '../farmer-badge/Farmer badge ';

@Component({
  selector: 'app-farm-card',
  imports: [FarmerBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './farm-card.html',
  styleUrl: './farm-card.scss',
})
export class FarmCard {
  readonly farm = input.required<FarmerFarm>();
}
