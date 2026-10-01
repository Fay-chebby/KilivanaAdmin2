import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { ConfirmModal } from '../../../inspectors/components/confirm-modal/confirm-modal';
import {
  CATEGORIES,
  PRODUCT_STATUS_META,
  Product,
  ProductStatus,
  coverOf,
  stockState,
  visibility,
} from '../../models/product.model';
import { ProductService } from '../../services/product.service';

type Action = { type: 'delete' | 'suspend'; product: Product };

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, StatCard, ConfirmModal, CurrencyKshPipe],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList {
  protected readonly service = inject(ProductService);
  protected readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly category = signal('');
  protected readonly status = signal<'' | ProductStatus>('');
  protected readonly view = signal<'table' | 'grid'>('table');
  protected readonly action = signal<Action | null>(null);

  protected readonly stats = this.service.stats;
  protected readonly categories = CATEGORIES;
  protected readonly meta = PRODUCT_STATUS_META;
  protected readonly cover = coverOf;
  protected readonly stock = stockState;
  protected readonly vis = visibility;

  protected readonly rows = computed(() => {
    const q = this.search().toLowerCase().trim();
    return this.service
      .products()
      .filter(
        (p) =>
          (!this.category() || p.category === this.category()) &&
          (!this.status() || p.status === this.status()) &&
          (!q ||
            [p.name, p.code, p.sellerName, p.county, p.category].some((v) =>
              v.toLowerCase().includes(q),
            )),
      );
  });

  protected num(n: number) {
    return n.toLocaleString('en-KE');
  }
  protected compact(n: number) {
    return n >= 1e6
      ? (n / 1e6).toFixed(1) + 'M'
      : n >= 1e3
        ? Math.round(n / 1e3) + 'K'
        : '' + Math.round(n);
  }
  protected pct() {
    const s = this.stats();
    return s.total ? Math.round((s.live / s.total) * 100) : 0;
  }

  protected confirm(reason: string) {
    const a = this.action();
    if (!a) return;
    if (a.type === 'delete') this.service.remove(a.product.id);
    else this.service.suspend(a.product.id, reason);
    this.action.set(null);
  }
}
