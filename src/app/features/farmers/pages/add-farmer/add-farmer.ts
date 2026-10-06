import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { FarmerService, apiError } from '../../services/farmer.service';
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

  readonly regions = toSignal(this.service.regions().pipe(catchError(() => of([] as string[]))), {
    initialValue: [] as string[],
  });
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  save(v: FarmerFormValue) {
    this.saving.set(true);
    this.error.set(null);
    this.service.create(v).subscribe({
      next: (f) => this.router.navigate(['/farmers', f.id]),
      error: (e) => {
        this.saving.set(false);
        this.error.set(apiError(e));
      },
    });
  }
  cancel() {
    this.router.navigate(['/farmers']);
  }
}
