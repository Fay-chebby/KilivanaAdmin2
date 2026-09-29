import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FarmerService } from '../../services/farmer.service';
import { FarmerForm } from '../../components/farmer-form/farmer-form';
import { FarmerFormValue } from '../../models/farmer.model';

@Component({
  selector: 'app-add-farmer',
  imports: [RouterLink, FarmerForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-farmer.html',
  styleUrl: './add-farmer.scss',
})
export class AddFarmer {
  private readonly service = inject(FarmerService);
  private readonly router = inject(Router);

  save(v: FarmerFormValue) {
    const created = this.service.create(v);
    this.router.navigate(['/farmers', created.id]);
  }
  cancel() {
    this.router.navigate(['/farmers']);
  }
}
