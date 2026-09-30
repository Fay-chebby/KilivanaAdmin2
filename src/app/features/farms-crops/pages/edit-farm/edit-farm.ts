import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FarmForm } from '../../components/farm-form/farm-form';
import { FarmPayload } from '../../models/farm.model';
import { FarmService } from '../../services/farm.service';

@Component({
  selector: 'app-edit-farm',
  imports: [FarmForm, RouterLink],
  templateUrl: './edit-farm.html',
  styleUrl: './edit-farm.scss',
})
export class EditFarm {
  private readonly service = inject(FarmService);
  private readonly router = inject(Router);
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly farm = computed(() => this.service.getById(this.id) ?? null);

  protected save(p: FarmPayload) {
    this.service.update(this.id, p);
    this.router.navigate(['/farms', this.id]);
  }
  protected cancel() {
    this.router.navigate(['/farms', this.id]);
  }
}
