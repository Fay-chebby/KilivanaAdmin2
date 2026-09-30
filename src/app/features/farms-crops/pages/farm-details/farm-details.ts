import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmModal } from '../../../inspectors/components/confirm-modal/confirm-modal';
import { FarmGallery } from '../../components/farm-gallery/farm-gallery';
import { InspectionPanel } from '../../components/inspection-panel/inspection-panel';
import { FARM_STATUS_META, INSPECTION_META } from '../../models/farm.model';
import { FarmService } from '../../services/farm.service';

@Component({
  selector: 'app-farm-details',
  imports: [RouterLink, ConfirmModal, FarmGallery, InspectionPanel],
  templateUrl: './farm-details.html',
  styleUrl: './farm-details.scss',
})
export class FarmDetails {
  private readonly service = inject(FarmService);
  private readonly router = inject(Router);
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly farm = computed(() => this.service.getById(this.id));
  protected readonly confirmDelete = signal(false);
  protected readonly farmMeta = FARM_STATUS_META;
  protected readonly inspMeta = INSPECTION_META;

  protected acres(ha: number) {
    return (ha * 2.471).toFixed(1);
  }

  protected delete() {
    this.service.remove(this.id);
    this.router.navigate(['/farms']);
  }
}
