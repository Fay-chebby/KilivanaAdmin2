import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { FarmGallery } from '../../../farms-crops/components/farm-gallery/farm-gallery';
import { FarmService } from '../../../farms-crops/services/farm.service';
import { ConfirmModal } from '../../../inspectors/components/confirm-modal/confirm-modal';
import { VerificationPanel } from '../../components/verification-panel/verification-panel';
import { PRODUCT_STATUS_META, coverOf, stockState, visibility } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-details',
  imports: [RouterLink, ConfirmModal, FarmGallery, VerificationPanel, CurrencyKshPipe],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails {
  private readonly service = inject(ProductService);
  private readonly farms = inject(FarmService);
  private readonly router = inject(Router);
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly product = computed(() => this.service.getById(this.id));
  protected readonly vis = computed(() => {
    const p = this.product();
    return p ? visibility(p) : null;
  });
  protected readonly farm = computed(() => {
    const p = this.product();
    return p?.farmId ? this.farms.getById(p.farmId) : undefined;
  });
  protected readonly modal = signal<'suspend' | 'delete' | 'resubmit' | null>(null);
  protected readonly meta = PRODUCT_STATUS_META;
  protected readonly cover = coverOf;
  protected readonly stock = stockState;

  protected num(n: number) {
    return n.toLocaleString('en-KE');
  }
  protected reactivate() {
    this.service.reactivate(this.id);
  }

  protected confirm(reason: string) {
    const m = this.modal();
    if (m === 'delete') {
      this.service.remove(this.id);
      this.router.navigate(['/products']);
    } else if (m === 'suspend') this.service.suspend(this.id, reason);
    else if (m === 'resubmit') this.service.resubmit(this.id);
    this.modal.set(null);
  }
}
