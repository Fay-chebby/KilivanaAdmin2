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

  protected readonly filter = signal<Filter>('all');
  protected readonly index = signal<number | null>(null);

  // Maps each original image URL to its loaded blob URL.
  protected readonly loadedImages = signal<Record<string, string>>({});

  private readonly loading = new Set<string>();
  private destroyed = false;

  private readonly imageEffect = effect(() => {
    const images = this.images();

    for (const image of images) {
      const source = image.url?.trim();

      if (!source || this.loadedImages()[source] || this.loading.has(source)) {
        continue;
      }

      this.loading.add(source);

      this.imageLoader
        .load(source)
        .then((objectUrl) => {
          this.loading.delete(source);

          if (this.destroyed) {
            URL.revokeObjectURL(objectUrl);
            return;
          }

          this.loadedImages.update((current) => ({
            ...current,
            [source]: objectUrl,
          }));
        })
        .catch((error: unknown) => {
          this.loading.delete(source);
          console.error('Failed to load gallery image:', source, error);
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

    for (const objectUrl of Object.values(this.loadedImages())) {
      URL.revokeObjectURL(objectUrl);
    }

    this.loadedImages.set({});
  }
}
