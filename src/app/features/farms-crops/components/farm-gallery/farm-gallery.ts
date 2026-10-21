import {
  Component,
  HostListener,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import { GalleryImage } from '../../../../shared/models/gallery-image.model';
import { ImageLoader } from '../../../../shared/service/image-loader';

type Filter = 'all' | 'farmer' | 'inspector';

@Component({
  selector: 'app-farm-gallery',
  standalone: true,
  templateUrl: './farm-gallery.html',
  styleUrl: './farm-gallery.scss',
})
export class FarmGallery implements OnDestroy {
  readonly images = input.required<GalleryImage[]>();
  readonly sellerLabel = input('Farmer');

  private readonly imageLoader = inject(ImageLoader);

  private readonly backendOrigin = 'https://either-juvenile-progeny.ngrok-free.dev';

  private readonly apiBaseUrl = `${this.backendOrigin}/api/v1`;

  protected readonly filter = signal<Filter>('all');
  protected readonly index = signal<number | null>(null);
  protected readonly loadedImages = signal<Record<string, string>>({});

  private readonly loading = new Set<string>();
  private readonly objectUrls = new Map<string, string>();
  private destroyed = false;

  /**
   * Convert relative image paths to backend URLs.
   */
  private resolveImageUrl(value: string | null | undefined): string {
    const url = (value ?? '').trim();

    if (!url) {
      return '';
    }

    // Keep absolute URLs unchanged.
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    // Image endpoint already includes /api/v1.
    if (url.startsWith('/api/v1/')) {
      return `${this.backendOrigin}${url}`;
    }

    if (url === '/api/v1') {
      return this.apiBaseUrl;
    }

    // Other root-relative paths are treated as API paths.
    if (url.startsWith('/')) {
      return `${this.apiBaseUrl}${url}`;
    }

    if (url.startsWith('api/v1/')) {
      return `${this.backendOrigin}/${url}`;
    }

    return `${this.apiBaseUrl}/${url}`;
  }

  private readonly imageEffect = effect(() => {
    const images = this.images();

    for (const image of images) {
      const originalUrl = (image.url ?? '').trim();
      const source = this.resolveImageUrl(originalUrl);

      if (!source || this.loadedImages()[originalUrl] || this.loading.has(originalUrl)) {
        continue;
      }

      this.loading.add(originalUrl);

      this.imageLoader
        .load(source)
        .then((objectUrl) => {
          this.loading.delete(originalUrl);

          if (this.destroyed) {
            URL.revokeObjectURL(objectUrl);
            return;
          }

          // If the same source was loaded again, release the previous URL.
          const previous = this.objectUrls.get(originalUrl);

          if (previous) {
            URL.revokeObjectURL(previous);
          }

          this.objectUrls.set(originalUrl, objectUrl);

          this.loadedImages.update((current) => ({
            ...current,
            [originalUrl]: objectUrl,
          }));
        })
        .catch((error: unknown) => {
          this.loading.delete(originalUrl);

          if (!this.destroyed) {
            console.error('Failed to load farm gallery image:', source, error);
          }
        });
    }
  });

  protected readonly farmerCount = computed(
    () => this.images().filter((i) => i.uploadedBy === 'farmer').length,
  );

  protected readonly inspectorCount = computed(
    () => this.images().filter((i) => i.uploadedBy === 'inspector').length,
  );

  protected readonly visible = computed(() =>
    this.images().filter((i) => this.filter() === 'all' || i.uploadedBy === this.filter()),
  );

  protected readonly current = computed(() => {
    const i = this.index();
    return i === null ? null : (this.visible()[i] ?? null);
  });

  protected imageUrl(originalUrl: string): string {
    return this.loadedImages()[originalUrl?.trim()] ?? '';
  }

  protected setFilter(filter: Filter): void {
    this.filter.set(filter);
    this.index.set(null);
  }

  protected close(): void {
    this.index.set(null);
  }

  protected step(direction: number): void {
    const i = this.index();
    const length = this.visible().length;

    if (i !== null && length) {
      this.index.set((i + direction + length) % length);
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    if (this.index() === null) return;

    if (event.key === 'Escape') this.close();
    if (event.key === 'ArrowRight') this.step(1);
    if (event.key === 'ArrowLeft') this.step(-1);
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    for (const objectUrl of this.objectUrls.values()) {
      URL.revokeObjectURL(objectUrl);
    }

    this.objectUrls.clear();
    this.loading.clear();
    this.loadedImages.set({});
  }
}
