import { Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core';

import { ImageLoader } from '../../../../shared/service/image-loader';

import { GRADES, Grade, Product, VERIFY_META, SellerType } from '../../models/product.model';

import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-verification-panel',
  standalone: true,
  imports: [],
  templateUrl: './verification-panel.html',
  styleUrl: './verification-panel.scss',
})
export class VerificationPanel implements OnDestroy {
  protected readonly service = inject(ProductService);

  private readonly imageLoader = inject(ImageLoader);

  // Product received from the parent component.
  readonly product = input.required<Product>();

  // Available quality grades.
  protected readonly grades = GRADES;

  // Admin's temporary selections.
  protected readonly draftSellerType = signal<SellerType | null>(null);

  protected readonly draftGrade = signal<Grade | null>(null);

  protected readonly draftNotes = signal<string | null>(null);

  protected readonly draftQty = signal<number | null>(null);

  // Local error message.
  protected readonly error = signal('');

  // Current verification information.
  protected readonly v = computed(() => this.product().verification);

  // Verification status metadata.
  protected readonly meta = computed(() => VERIFY_META[this.v().status]);

  /**
   * Seller classification.
   * Uses the admin's selection first.
   * Otherwise uses the product's existing seller type.
   */
  protected readonly sellerType = computed<SellerType>(
    () => this.draftSellerType() ?? this.product().sellerType,
  );

  // Admin notes.
  protected readonly notes = computed(() => this.draftNotes() ?? this.v().notes);

  // Confirmed quantity.
  protected readonly qty = computed(
    () => this.draftQty() ?? this.v().verifiedQty ?? this.product().stock,
  );

  // Confirmed quality grade.
  protected readonly grade = computed<Grade>(
    () => this.draftGrade() ?? this.product().grade ?? 'GRADE_A',
  );

  // Product photos uploaded by the seller.
  protected readonly photos = computed(() => this.product().images);

  // Number of completed checklist items.
  protected readonly checked = computed(
    () => this.v().checklist.filter((item) => item.checked).length,
  );

  // Whether all checklist items have been completed.
  protected readonly allChecked = computed(
    () => this.v().checklist.length > 0 && this.checked() === this.v().checklist.length,
  );

  // Loaded image URLs.
  protected readonly loadedPhotos = signal<Record<string, string>>({});

  private readonly currentPhotoUrls = new Map<string, string>();

  private destroyed = false;

  /**
   * Load product photos whenever the image list changes.
   */
  private readonly photosEffect = effect(() => {
    const photos = this.photos();

    const nextUrls = new Map(photos.map((photo) => [photo.id, photo.url.trim()]));

    // Release removed or changed photos.
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

    // Load new photos.
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
          // Ignore removed photos and destroyed components.
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

  /**
   * Toggle a checklist item.
   */
  protected toggle(key: string): void {
    this.error.set('');

    this.service.toggleCheck(this.product().id, key);
  }

  /**
   * Reopen a completed verification.
   */
  protected reopen() {
    this.draftSellerType.set(null);

    this.draftNotes.set(null);

    this.draftQty.set(null);

    this.draftGrade.set(null);

    this.error.set('');

    return this.service.reopen(this.product().id);
  }

  /**
   * Approve or reject a product.
   */
  protected async decide(result: 'approved' | 'rejected'): Promise<void> {
    const notes = this.notes().trim();

    const confirmedQty = this.qty();

    const selectedSellerType = this.sellerType();

    // Validate approval.
    if (result === 'approved') {
      if (!this.allChecked()) {
        this.error.set('Tick every item on the checklist before approving.');

        return;
      }

      if (this.photos().length === 0) {
        this.error.set('The seller must upload at least one product photo before approval.');

        return;
      }

      if (!Number.isFinite(confirmedQty) || confirmedQty <= 0) {
        this.error.set('Enter the quantity you verified. It must be above 0.');

        return;
      }
    }

    // Rejection requires an explanation.
    if (result === 'rejected' && !notes) {
      this.error.set('Add a note explaining why this product is being rejected.');

      return;
    }

    this.error.set('');

    // Prepare decision payload.
    const decision: {
      notes: string;
      qty: number;
      grade: Grade | null;
      sellerType: SellerType;
    } = {
      notes,

      qty: Math.max(0, confirmedQty),

      // Only farmer products require a produce grade.
      grade: selectedSellerType === 'farmer' ? this.grade() : null,

      // Save the selected seller classification.
      sellerType: selectedSellerType,
    };

    const success = await this.service.decide(this.product().id, result, decision);

    if (!success) {
      this.error.set(this.service.error() ?? 'Could not save the verification decision.');
    }
  }

  /**
   * Release loaded image URLs when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.destroyed = true;

    for (const url of this.currentPhotoUrls.values()) {
      this.imageLoader.revoke(url);
    }

    this.currentPhotoUrls.clear();
  }
}
