import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { StatCard } from '../../../../shared/components/stat-card/stat-card';

import { ConfirmModal } from '../../../inspectors/components/confirm-modal/confirm-modal';

import {
  FARM_STATUS_META,
  Farm,
  INSPECTION_META,
  InspectionStatus,
  coverOf,
} from '../../models/farm.model';

import { FarmService } from '../../services/farm.service';

@Component({
  selector: 'app-farm-list',
  imports: [RouterLink, StatCard, ConfirmModal],
  templateUrl: './farm-list.html',
  styleUrl: './farm-list.scss',
})
export class FarmList {
  protected readonly service = inject(FarmService);
  protected readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly county = signal('');
  protected readonly inspection = signal<'' | InspectionStatus>('');
  protected readonly view = signal<'table' | 'grid'>('table');
  protected readonly toDelete = signal<Farm | null>(null);

  protected readonly stats = this.service.stats;

  protected readonly cover = coverOf;

  protected readonly inspMeta = INSPECTION_META;
  protected readonly farmMeta = FARM_STATUS_META;

  /**
   * Available inspection statuses for the filter dropdown.
   */
  protected readonly inspectionStatuses: InspectionStatus[] = [
    'unassigned',
    'assigned',
    'in_review',
    'approved',
    'rejected',
  ];

  protected readonly counties = computed(() =>
    [...new Set(this.service.farms().map((f) => f.county))].sort(),
  );

  protected readonly rows = computed(() => {
    const q = this.search().toLowerCase().trim();

    return this.service
      .farms()
      .filter(
        (f) =>
          (!this.county() || f.county === this.county()) &&
          (!this.inspection() || f.inspection.status === this.inspection()) &&
          (!q ||
            [f.name, f.code, f.ownerName, f.county, ...f.crops].some((v) =>
              v.toLowerCase().includes(q),
            )),
      );
  });

  protected initials(name: string) {
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  protected delete() {
    const f = this.toDelete();

    if (f) {
      this.service.remove(f.id);
    }

    this.toDelete.set(null);
  }
}
