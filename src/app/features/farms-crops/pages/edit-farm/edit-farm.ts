import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { FarmForm } from '../../components/farm-form/farm-form';
import { Farm, FarmEditValue, FarmPayload } from '../../models/farm.model';
import { FarmService, apiError } from '../../services/farm.service';

@Component({
  selector: 'app-edit-farm',
  imports: [FarmForm, RouterLink],
  templateUrl: './edit-farm.html',
  styleUrl: './edit-farm.scss',
})
export class EditFarm implements OnInit {
  private readonly service = inject(FarmService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly farm = signal<Farm | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.id || !Number.isFinite(Number(this.id))) {
      this.error.set('Invalid farm ID.');
      this.loading.set(false);
      return;
    }

    this.service.getFarm(this.id).subscribe({
      next: (farm) => {
        this.farm.set(farm);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.loading.set(false);
      },
    });
  }

  protected save(payload: FarmPayload): void {
    const current = this.farm();

    if (!current || this.saving()) {
      return;
    }

    const value: FarmEditValue = {
      name: payload.name,
      county: payload.county,
      subCounty: current.subCounty ?? '',
      address: payload.location,
      sizeAcres: payload.sizeHa * 2.47105,
      ownershipType: current.ownershipType ?? '',
      description: payload.description ?? '',
    };

    this.saving.set(true);
    this.error.set(null);

    this.service.updateFarm(Number(this.id), value).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/farms-crops', this.id]);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.saving.set(false);
      },
    });
  }

  protected cancel(): void {
    this.router.navigate(['/farms', this.id]);
  }
}
