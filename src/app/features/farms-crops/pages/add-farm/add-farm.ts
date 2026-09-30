import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FarmForm } from '../../components/farm-form/farm-form';
import { FarmPayload } from '../../models/farm.model';
import { FarmService } from '../../services/farm.service';

@Component({
  selector: 'app-add-farm',
  imports: [FarmForm, RouterLink],
  templateUrl: './add-farm.html',
  styleUrl: './add-farm.scss',
})
export class AddFarm {
  private readonly service = inject(FarmService);
  private readonly router = inject(Router);

  protected save(p: FarmPayload) {
    const farm = this.service.create(p);
    this.router.navigate(['/farms', farm.id]); // opens the farm so you can assign an inspector
  }
  protected cancel() {
    this.router.navigate(['/farms']);
  }
}
