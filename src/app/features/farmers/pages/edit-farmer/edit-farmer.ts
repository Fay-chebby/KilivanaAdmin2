import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { FarmerService } from '../../services/farmer.service';
import { FarmerForm } from '../../components/farmer-form/farmer-form';
import { FarmerFormValue } from '../../models/farmer.model';

@Component({
  selector: 'app-edit-farmer',
  imports: [RouterLink, FarmerForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-farmer.html',
  styleUrl: './edit-farmer.scss',
})
export class EditFarmer {
  private readonly service = inject(FarmerService);
  private readonly router = inject(Router);
  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  readonly farmer = computed(() => this.service.getById(this.id()));

  save(v: FarmerFormValue) {
    this.service.update(this.id(), v);
    this.router.navigate(['/farmers', this.id()]);
  }
  cancel() {
    this.router.navigate(['/farmers', this.id()]);
  }
}
