import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { FarmGallery } from '../../../farms-crops/components/farm-gallery/farm-gallery';
import { ConfirmModal } from '../../../inspectors/components/confirm-modal/confirm-modal';
// import { ApiBanner } from '../../components/api-banner/api-banner';
import { VerificationPanel } from '../../components/verification-panel/verification-panel';
import {
  PRODUCT_STATUS_META,
  coverOf,
  gradeLabel,
  stockState,
  visibility,
} from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-details',
  imports: [RouterLink, ConfirmModal, FarmGallery, VerificationPanel, CurrencyKshPipe],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails {
  protected readonly service = inject(ProductService);
  private readonly router = inject(Router);
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

  constructor() {
    this.service.ensureLoaded().then(() => this.service.loadEvidence(this.id));
  }

  protected num(n: number) {
    return n.toLocaleString('en-KE');
  }
  protected reactivate() {
    return this.service.reactivate(this.id);
  }

  protected async confirm(reason: string) {
    const m = this.modal();
    this.modal.set(null);
    if (m === 'delete') {
      if (await this.service.remove(this.id)) this.router.navigate(['/products']);
    } else if (m === 'suspend') await this.service.suspend(this.id, reason);
    else if (m === 'resubmit') await this.service.resubmit(this.id);
  }
}
