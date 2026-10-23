import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ConfirmModal } from '../../../inspectors/components/confirm-modal/confirm-modal';
import { FarmGallery } from '../../components/farm-gallery/farm-gallery';
import { InspectionPanel } from '../../components/inspection-panel/inspection-panel';
import { AssignInspectorDialog } from '../../components/assign-inspector-dialog/assign-inspector-dialog';
import { InspectionRequest } from '../../models/inspection.model';

import { FARM_STATUS_META, INSPECTION_META, Farm } from '../../models/farm.model';

import { FarmService, apiError } from '../../services/farm.service';

@Component({
  selector: 'app-farm-details',
  imports: [RouterLink, ConfirmModal, FarmGallery, InspectionPanel, AssignInspectorDialog],
  templateUrl: './farm-details.html',
  styleUrl: './farm-details.scss',
})
export class FarmDetails implements OnInit {
  private readonly service = inject(FarmService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly farm = signal<Farm | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly deleting = signal(false);
  protected readonly confirmDelete = signal(false);
  showAssignInspector = signal(false);

  protected readonly farmMeta = FARM_STATUS_META;
  protected readonly inspMeta = INSPECTION_META;

  protected readonly hasFarm = computed(() => this.farm() !== null);
  protected readonly assigningInspector = signal(false);

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

  protected acresToHectares(acres: number | null): string {
    return acres == null ? '—' : (acres * 0.404686).toFixed(1);
  }

  protected delete(): void {
    const farm = this.farm();

    if (!farm || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.error.set(null);

    this.service.deleteFarm(farm.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.confirmDelete.set(false);
        this.router.navigate(['/farms']);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.deleting.set(false);
      },
    });
  }
  protected statusMeta(status: string) {
    const key = status.toUpperCase();

    if (key === 'ACTIVE' || key === 'FALLOW' || key === 'INACTIVE') {
      return FARM_STATUS_META[key];
    }

    return {
      label: status || 'Unknown',
      tone: 'gray' as const,
    };
  }
  protected assignInspector(event: { id: string; name: string; dueDate: string }): void {
    const farm = this.farm();

    if (!farm || this.assigningInspector()) {
      return;
    }

    const inspectorId = Number(event.id);
    const farmId = Number(farm.id);

    if (!Number.isFinite(inspectorId) || !Number.isFinite(farmId)) {
      this.error.set('Invalid farm or inspector ID.');
      return;
    }

    const request: InspectionRequest = {
      inspectorId,
      targetType: 'FARM',
      targetId: farmId,
      status: 'ASSIGNED',
    };

    this.assigningInspector.set(true);
    this.error.set(null);

    this.service.assignInspector(request).subscribe({
      next: (inspection) => {
        this.assigningInspector.set(false);
        this.showAssignInspector.set(false);

        // Refresh the farm details so the latest inspection can be displayed.
        this.service.getFarm(String(farmId)).subscribe({
          next: (updatedFarm) => this.farm.set(updatedFarm),
          error: (err: unknown) => {
            console.error('Could not refresh farm details:', apiError(err));
          },
        });

        console.log('Inspector assigned successfully:', inspection);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.assigningInspector.set(false);
      },
    });
  }
}
