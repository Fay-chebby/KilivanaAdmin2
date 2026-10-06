import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, map, switchMap, tap } from 'rxjs';
import { FarmerService, apiError } from '../../services/farmer.service';
import { FarmerBadge } from '../../components/farmer-badge/Farmer badge ';
import { FarmerActionDialog } from '../../components/farmer-action-dialog/farmer-action-dialog';
import {
  FarmerAction,
  FarmerDetail,
  STATUS_LABEL,
  avatarColor,
  initials,
  statusTone,
} from '../../models/farmer.model';

type Tab = 'overview' | 'images';
type LoadState = 'loading' | 'ready' | 'notfound' | 'error';

@Component({
  selector: 'app-farmer-details',
  imports: [RouterLink, DatePipe, FarmerBadge, FarmerActionDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './farmer-details.html',
  styleUrl: './farmer-details.scss',
})
export class FarmerDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(FarmerService);

  readonly statusLabel = STATUS_LABEL;
  readonly statusTone = statusTone;
  readonly initials = initials;
  readonly avatarColor = avatarColor;

  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'images', label: 'Images' },
  ];
  readonly tab = signal<Tab>('overview');
  readonly state = signal<LoadState>('loading');
  readonly errorMsg = signal('');
  readonly farmer = signal<FarmerDetail | null>(null);

  readonly dialog = signal<FarmerAction | null>(null);
  readonly busy = signal(false);
  readonly actionError = signal<string | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        map((p) => p.get('id') ?? ''),
        tap(() => this.state.set('loading')),
        switchMap((id) =>
          this.service.getDetail(id).pipe(
            catchError((e: HttpErrorResponse) => {
              this.errorMsg.set(apiError(e));
              this.state.set(e.status === 404 ? 'notfound' : 'error');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((f) => {
        this.farmer.set(f);
        this.state.set('ready');
      });
  }

  ask(action: FarmerAction) {
    this.actionError.set(null);
    this.dialog.set(action);
  }
  closeDialog() {
    if (!this.busy()) this.dialog.set(null);
  }

  confirm(reason: string) {
    const action = this.dialog();
    const f = this.farmer();
    if (!action || !f) return;
    this.busy.set(true);
    this.actionError.set(null);
    this.service.applyAction(f.id, action, reason).subscribe({
      next: (updated) => {
        this.farmer.update((d) => (d ? { ...d, ...updated } : d));
        this.busy.set(false);
        this.dialog.set(null);
      },
      error: (e) => {
        this.busy.set(false);
        this.actionError.set(apiError(e));
      },
    });
  }
}
