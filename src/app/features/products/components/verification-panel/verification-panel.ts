import { Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { ImageLoader } from '../../../../shared/service/image-loader';
import { GRADES, Grade, Product, VERIFY_META } from '../../models/product.model';

import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-verification-panel',
  standalone: true,
  imports: [],
  templateUrl: './verification-panel.html',
  styleUrl: './verification-panel.scss',
})
export class VerificationPanel {
  protected readonly service = inject(ProductService);

  readonly product = input.required<Product>();

  protected readonly steps = ['Submitted', 'Admin review', 'Verification check', 'Decision'];

  protected readonly grades = GRADES;

  protected readonly draftGrade = signal<Grade | null>(null);
  protected readonly draftNotes = signal<string | null>(null);
  protected readonly draftQty = signal<number | null>(null);
  protected readonly error = signal('');

  protected readonly v = computed(() => this.product().verification);

  protected readonly meta = computed(() => VERIFY_META[this.v().status]);

  protected readonly notes = computed(() => this.draftNotes() ?? this.v().notes);

  protected readonly qty = computed(
    () => this.draftQty() ?? this.v().verifiedQty ?? this.product().stock,
  );

  protected readonly grade = computed<Grade>(
    () => this.draftGrade() ?? this.product().grade ?? 'GRADE_A',
  );

  /**
   * Show the photos submitted by the farmer.
   * No inspector photos are required.
   */
  protected readonly photos = computed(() => this.product().images);

  protected readonly checked = computed(
    () => this.v().checklist.filter((item) => item.checked).length,
  );

  protected readonly allChecked = computed(
    () => this.v().checklist.length > 0 && this.checked() === this.v().checklist.length,
  );

  /**
   * Verification no longer starts an inspection.
   * The admin reviews the product directly.
   */
  protected start(): void {
    this.error.set('');
  }

  protected toggle(key: string): void {
    this.service.toggleCheck(this.product().id, key);
  }

  protected removePhoto(id: string) {
    return this.service.removeImage(this.product().id, id);
  }

  protected reopen() {
    this.draftNotes.set(null);
    this.draftQty.set(null);
    this.draftGrade.set(null);
    this.error.set('');

    return this.service.reopen(this.product().id);
  }

  protected async decide(result: 'approved' | 'rejected') {
    const notes = this.notes().trim();

    if (result === 'approved') {
      if (!this.allChecked()) {
        this.error.set('Tick every item on the checklist before approving.');
        return;
      }

      if (this.photos().length === 0) {
        this.error.set('The farmer must upload at least one product photo before approval.');
        return;
      }

      if (!(this.qty() > 0)) {
        this.error.set('Enter the quantity you verified. It must be above 0.');
        return;
      }
    } else if (!notes) {
      this.error.set('Add a note explaining why this product is being rejected.');
      return;
    }

    this.error.set('');

    const success = await this.service.decide(this.product().id, result, {
      notes,
      qty: Math.max(0, this.qty()),
      grade: this.grade(),
    });

    if (!success) {
      this.error.set(this.service.error() ?? 'Could not save the verification decision.');
    }
  }
  protected readonly loadedPhotos = signal<Record<string, string>>({});

  private readonly imageLoader = inject(ImageLoader);

  private readonly currentPhotoUrls = new Map<string, string>();
  private destroyed = false;

  private readonly photosEffect = effect(() => {
    const photos = this.photos();

    // Record the current photo IDs and URLs.
    const nextUrls = new Map(photos.map((photo) => [photo.id, photo.url.trim()]));

    // Release photos that have been removed or whose URLs changed.
    for (const [photoId, previousUrl] of this.currentPhotoUrls) {
      if (nextUrls.get(photoId) !== previousUrl) {
        this.imageLoader.revoke(previousUrl);
        this.currentPhotoUrls.delete(photoId);

        this.loadedPhotos.update((current) => {
          const updated = { ...current };
          delete updated[photoId];
          return updated;
        });
      }
    }

    // Load every farmer-uploaded photo.
    for (const photo of photos) {
      const photoId = photo.id;
      const url = photo.url.trim();

      if (!url || this.currentPhotoUrls.get(photoId) === url) {
        continue;
      }

      this.currentPhotoUrls.set(photoId, url);

      this.imageLoader
        .load(url)
        .then((objectUrl) => {
          // Ignore results for removed photos or a destroyed component.
          if (this.destroyed || this.currentPhotoUrls.get(photoId) !== url) {
            URL.revokeObjectURL(objectUrl);
            return;
          }

          this.loadedPhotos.update((current) => ({
            ...current,
            [photoId]: objectUrl,
          }));
        })
        .catch((error: unknown) => {
          if (!this.destroyed && this.currentPhotoUrls.get(photoId) === url) {
            console.error(`Failed to load product photo ${photoId}:`, error);
          }
        });
    }
  });

  ngOnDestroy(): void {
    this.destroyed = true;

    for (const url of this.currentPhotoUrls.values()) {
      this.imageLoader.revoke(url);
    }

    this.currentPhotoUrls.clear();
  }
}
