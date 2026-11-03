import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, map, switchMap, tap } from 'rxjs';

import { FarmerService, apiError } from '../../services/farmer.service';
import { FarmCard } from '../../components/farm-card/farm-card';
import { FarmerBadge } from '../../components/farmer-badge/Farmer badge ';
import { FarmerActionDialog } from '../../components/farmer-action-dialog/farmer-action-dialog';
import { ImageLoader } from '../../../../shared/service/image-loader';
import { API_BASE } from '../../../../core/config/api.config';

import {
  DOC_LABEL,
  FarmerAction,
  FarmerDetail,
  STATUS_LABEL,
  avatarColor,
  docTone,
  initials,
  statusTone,
  titleCase,
} from '../../models/farmer.model';

type Tab = 'overview' | 'farms' | 'documents' | 'products';
type LoadState = 'loading' | 'ready' | 'notfound' | 'error';

@Component({
  selector: 'app-farmer-details',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe, FarmerBadge, FarmerActionDialog, FarmCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './farmer-details.html',
  styleUrl: './farmer-details.scss',
})
export class FarmerDetails implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(FarmerService);
  private readonly imageLoader = inject(ImageLoader);

  /**
   * API_BASE should contain the backend base URL, including /api/v1.
   * Example: https://your-backend.example/api/v1
   */
  private readonly apiBaseUrl = API_BASE.replace(/\/+$/, '');

  /**
   * Backend origin without the /api/v1 path.
   */
  private readonly backendOrigin = this.apiBaseUrl.replace(/\/api\/v1$/, '');

  readonly statusLabel = STATUS_LABEL;
  readonly statusTone = statusTone;
  readonly initials = initials;
  readonly docLabel = DOC_LABEL;
  readonly docTone = docTone;
  readonly titleCase = titleCase;
  readonly avatarColor = avatarColor;

  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'farms', label: 'Farms' },
    { id: 'documents', label: 'Documents' },
    { id: 'products', label: 'Products' },
  ];

  readonly tab = signal<Tab>('overview');
  readonly state = signal<LoadState>('loading');
  readonly errorMsg = signal('');
  readonly farmer = signal<FarmerDetail | null>(null);

  readonly dialog = signal<FarmerAction | null>(null);
  readonly busy = signal(false);
  readonly actionError = signal<string | null>(null);

  protected readonly loadedProfileImages = signal<Record<string, string>>({});

  private readonly currentImageUrls = new Map<string, string>();
  private destroyed = false;

  protected imageKey(id: string | number): string {
    return String(id);
  }

  /**
   * Convert relative image paths into absolute backend URLs.
   */
  private resolveImageUrl(value: string | null | undefined): string {
    const url = (value ?? '').trim();

    if (!url) {
      return '';
    }

    // Absolute URLs are already complete.
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    // Avoid adding /api/v1 twice.
    if (url.startsWith('/api/v1/')) {
      return `${this.backendOrigin}${url}`;
    }

    if (url === '/api/v1') {
      return this.apiBaseUrl;
    }

    // Other root-relative API paths.
    if (url.startsWith('/')) {
      return `${this.apiBaseUrl}${url}`;
    }

    if (url.startsWith('api/v1/')) {
      return `${this.backendOrigin}/${url}`;
    }

    return `${this.apiBaseUrl}/${url}`;
  }

  /**
   * Load profile photos and clean up outdated object URLs.
   */
  private readonly profileImagesEffect = effect(() => {
    const images = this.farmer()?.profileImages ?? [];
    const nextUrls = new Map<string, string>();

    for (const img of images) {
      nextUrls.set(String(img.id), this.resolveImageUrl(img.url));
    }

    // Release removed or changed image URLs.
    for (const [imageId, previousUrl] of this.currentImageUrls) {
      if (nextUrls.get(imageId) !== previousUrl) {
        this.imageLoader.revoke(previousUrl);
        this.currentImageUrls.delete(imageId);

        this.loadedProfileImages.update((current) => {
          const updated = { ...current };
          delete updated[imageId];
          return updated;
        });
      }
    }

    // Load each profile photo.
    for (const img of images) {
      const imageId = String(img.id);
      const url = this.resolveImageUrl(img.url);

      if (!url || this.currentImageUrls.get(imageId) === url) {
        continue;
      }

      this.currentImageUrls.set(imageId, url);

      this.imageLoader
        .load(url)
        .then((objectUrl) => {
          // Ignore outdated responses or responses after destruction.
          if (this.destroyed || this.currentImageUrls.get(imageId) !== url) {
            URL.revokeObjectURL(objectUrl);
            return;
          }

          this.loadedProfileImages.update((current) => ({
            ...current,
            [imageId]: objectUrl,
          }));
        })
        .catch((error: unknown) => {
          if (!this.destroyed && this.currentImageUrls.get(imageId) === url) {
            console.error(`Failed to load farmer profile photo ${imageId}:`, error);
          }
        });
    }
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        tap(() => {
          this.state.set('loading');
          this.errorMsg.set('');
          this.farmer.set(null);
          this.tab.set('overview');
        }),
        switchMap((id) => {
          if (!id) {
            this.errorMsg.set('No farmer ID was provided.');
            this.state.set('notfound');
            return EMPTY;
          }

          return this.service.getDetail(id).pipe(
            catchError((error: HttpErrorResponse) => {
              this.errorMsg.set(apiError(error));
              this.state.set(error.status === 404 ? 'notfound' : 'error');
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((farmer) => {
        this.farmer.set(farmer);
        this.state.set('ready');
      });
  }

  ask(action: FarmerAction): void {
    this.actionError.set(null);
    this.dialog.set(action);
  }

  closeDialog(): void {
    if (!this.busy()) {
      this.dialog.set(null);
    }
  }

  confirm(reason: string): void {
    const action = this.dialog();
    const farmer = this.farmer();

    if (!action || !farmer) {
      return;
    }

    this.busy.set(true);
    this.actionError.set(null);

    this.service.applyAction(farmer.id, action, reason).subscribe({
      next: (updated) => {
        this.farmer.update((current) => (current ? { ...current, ...updated } : current));

        this.busy.set(false);
        this.dialog.set(null);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.actionError.set(apiError(error));
      },
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    for (const url of Object.values(this.loadedProfileImages())) {
      URL.revokeObjectURL(url);
    }

    this.currentImageUrls.clear();
    this.loadedProfileImages.set({});
  }
}
