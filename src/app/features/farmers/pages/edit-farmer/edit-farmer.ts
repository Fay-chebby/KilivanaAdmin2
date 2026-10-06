import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, map, of, switchMap } from 'rxjs';
import { FarmerService, apiError } from '../../services/farmer.service';
import { FarmerForm } from '../../components/farmer-form/farmer-form';
import { FarmerDetail, FarmerFormValue } from '../../models/farmer.model';

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
  private readonly route = inject(ActivatedRoute);

  readonly regions = toSignal(this.service.regions().pipe(catchError(() => of([] as string[]))), {
    initialValue: [] as string[],
  });
  readonly farmer = signal<FarmerDetail | null>(null);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        map((p) => p.get('id') ?? ''),
        switchMap((id) =>
          this.service.getDetail(id).pipe(
            catchError(() => {
              this.loadFailed.set(true);
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((f) => {
        this.farmer.set(f);
        this.loading.set(false);
      });
  }

  save(v: FarmerFormValue) {
    const f = this.farmer();
    if (!f) return;
    this.saving.set(true);
    this.error.set(null);
    this.service.update(f.id, v).subscribe({
      next: () => this.router.navigate(['/farmers', f.id]),
      error: (e) => {
        this.saving.set(false);
        this.error.set(apiError(e));
      },
    });
  }
  cancel() {
    this.router.navigate(['/farmers', this.farmer()?.id ?? '']);
  }
}
