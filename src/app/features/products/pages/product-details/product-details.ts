import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { FarmGallery } from '../../../farms-crops/components/farm-gallery/farm-gallery';
import { ConfirmModal } from '../../../inspectors/components/confirm-modal/confirm-modal';
import { VerificationPanel } from '../../components/verification-panel/verification-panel';

import {
  PRODUCT_STATUS_META,
  coverOf,
  gradeLabel,
  stockState,
  visibility,
} from '../../models/product.model';

import { ProductService } from '../../services/product.service';
import { ImageLoader } from '../../../../shared/service/image-loader';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [RouterLink, ConfirmModal, FarmGallery, VerificationPanel, CurrencyKshPipe],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails implements OnDestroy {
  protected readonly service = inject(ProductService);

  private readonly router = inject(Router);
  private readonly imageLoader = inject(ImageLoader);

  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly product = computed(() => this.service.getById(this.id));

  protected readonly vis = computed(() => {
    const p = this.product();
    return p ? visibility(p) : null;
  });

  protected readonly modal = signal<'suspend' | 'delete' | 'resubmit' | null>(null);

  protected readonly meta = PRODUCT_STATUS_META;
  protected readonly cover = coverOf;
  protected readonly grade = gradeLabel;
  protected readonly stock = stockState;

  // The URL displayed by the main product image.
  protected readonly loadedCover = signal('');

  private currentImageUrl = '';
  private destroyed = false;

  private readonly coverEffect = effect(() => {
    const p = this.product();
    const url = p ? this.cover(p).trim() : '';

    if (url === this.currentImageUrl) {
      return;
    }

    const previousUrl = this.currentImageUrl;

    this.currentImageUrl = url;
    this.loadedCover.set('');

    // Release the previous image URL.
    if (previousUrl) {
      this.imageLoader.revoke(previousUrl);
    }

    if (!url) {
      return;
    }

    this.imageLoader
      .load(url)
      .then((objectUrl) => {
        // The component or image selection may have changed
        // while the request was running.
        if (this.destroyed || this.currentImageUrl !== url) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        this.loadedCover.set(objectUrl);
      })
      .catch((error: unknown) => {
        if (!this.destroyed && this.currentImageUrl === url) {
          console.error('Failed to load product cover:', error);
          this.loadedCover.set('');
        }
      });
  });

  constructor() {
    this.service
      .ensureLoaded()
      .then(async () => {
        if (this.destroyed) {
          return;
        }

        // await this.service.loadEvidence(this.id);
      })
      .catch((error: unknown) => {
        console.error('Failed to load product details:', error);
      });
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    if (this.currentImageUrl) {
      this.imageLoader.revoke(this.currentImageUrl);
      this.currentImageUrl = '';
    }

    // Clear the displayed reference. ImageLoader owns cleanup
    // for object URLs associated with the original image URL.
    this.loadedCover.set('');
  }

  protected num(n: number): string {
    return n.toLocaleString('en-KE');
  }

  protected reactivate() {
    return this.service.reactivate(this.id);
  }

  protected async confirm(reason: string): Promise<void> {
    const action = this.modal();
    this.modal.set(null);

    if (action === 'delete') {
      if (await this.service.remove(this.id)) {
        this.router.navigate(['/products']);
      }
    } else if (action === 'suspend') {
      await this.service.suspend(this.id, reason);
    } else if (action === 'resubmit') {
      await this.service.resubmit(this.id);
    }
  }
}
