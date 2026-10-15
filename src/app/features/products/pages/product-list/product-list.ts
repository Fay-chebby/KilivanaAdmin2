import { Component, computed, inject, signal, effect, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { ConfirmModal } from '../../../inspectors/components/confirm-modal/confirm-modal';
// import { ApiBanner } from '../../components/api-banner/api-banner';
import {
  PRODUCT_STATUS_META,
  Product,
  ProductStatus,
  coverOf,
  gradeLabel,
  stockState,
  visibility,
} from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ImageLoader } from '../../../../shared/service/image-loader';

type Action = { type: 'delete' | 'suspend'; product: Product };

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, StatCard, ConfirmModal, CurrencyKshPipe],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnDestroy {
  protected readonly service = inject(ProductService);
  protected readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly category = signal('');
  protected readonly status = signal<'' | ProductStatus>('');
  protected readonly view = signal<'table' | 'grid'>('table');
  protected readonly action = signal<Action | null>(null);

  protected readonly stats = this.service.stats;
  protected readonly meta = PRODUCT_STATUS_META;
  protected readonly statusOptions: ProductStatus[] = [
    'active',
    'pending',
    'rejected',
    'suspended',
  ];
  protected readonly cover = coverOf;
  protected readonly grade = gradeLabel;
  protected readonly stock = stockState;
  protected readonly vis = visibility;
  private readonly imageLoader = inject(ImageLoader);

  protected readonly loadedCovers = signal<Record<string, string>>({});

  private readonly imageUrls = new Map<string, string>();

  private readonly coverEffect = effect(() => {
    const products = this.rows();

    for (const p of products) {
      const url = this.cover(p).trim();

      if (!url || this.imageUrls.has(p.id)) {
        continue;
      }

      this.imageUrls.set(p.id, url);

      this.imageLoader
        .load(url)
        .then((objectUrl) => {
          this.loadedCovers.update((covers) => ({
            ...covers,
            [p.id]: objectUrl,
          }));
        })
        .catch((error: unknown) => {
          console.error(`Failed to load image for product ${p.id}:`, error);
        });
    }
  });

  ngOnDestroy(): void {
    for (const url of this.imageUrls.values()) {
      this.imageLoader.revoke(url);
    }

    for (const objectUrl of Object.values(this.loadedCovers())) {
      URL.revokeObjectURL(objectUrl);
    }
  }

  protected readonly categoryNames = computed(() =>
    [...new Set(this.service.categories().map((c) => c.name))].sort(),
  );

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
      )
      .sort((a, b) => Number(b.id) - Number(a.id));
  });

  constructor() {
    this.service.ensureLoaded();
  }

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

  protected async confirm(reason: string) {
    const a = this.action();
    this.action.set(null);
    if (!a) return;
    if (a.type === 'delete') await this.service.remove(a.product.id);
    else await this.service.suspend(a.product.id, reason);
  }
}
