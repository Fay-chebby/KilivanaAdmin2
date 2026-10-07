import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FarmerBadge } from '../farmer-badge/Farmer badge ';
import { FarmerFarm, Tone, cropTone, titleCase } from '../../models/farmer.model';

@Component({
  selector: 'app-farm-card',
  imports: [FarmerBadge, DecimalPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './farm-card.html',
  styleUrl: './farm-card.scss',
})
export class FarmCard {
  readonly farm = input.required<FarmerFarm>();
  readonly cropTone = cropTone;
  readonly titleCase = titleCase;

  farmTone(status: string): Tone {
    const s = (status ?? '').toUpperCase();

    if (s === 'ACTIVE') {
      return 'green';
    }

    if (s === 'FALLOW') {
      return 'amber';
    }

    return 'gray';
  }

  location(): string {
    return (
      [this.farm().address, this.farm().subCounty, this.farm().county]
        .filter((value) => !!value)
        .join(', ') || 'No location'
    );
  }
}
