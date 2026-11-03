import { Component, computed, inject, signal, effect, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { ConfirmModal } from '../../../inspectors/components/confirm-modal/confirm-modal';
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
type SellerFilter = '' | 'farmer' | 'supplier';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, StatCard, ConfirmModal, CurrencyKshPipe],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnDestroy {
  protected readonly service = inject(ProductService);
  protected readonly router = inject(Router);

  // Filters and view
  protected readonly search = signal('');
  protected readonly category = signal('');
  protected readonly status = signal<'' | ProductStatus>('');
  protected readonly sellerType = signal<SellerFilter>('');
  protected readonly view = signal<'table' | 'grid'>('table');
  protected readonly action = signal<Action | null>(null);

  // Pagination
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizes = [10, 25, 50];

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

  protected readonly categoryNames = computed(() =>
    [...new Set(this.service.categories().map((c) => c.name))].sort(),
  );

  // Filter the complete product list first.
  protected readonly rows = computed(() => {
    const q = this.search().toLowerCase().trim();
    const selectedCategory = this.category();
    const selectedStatus = this.status();
    const selectedSeller = this.sellerType();

    return this.service
      .products()
      .filter((p) => {
        const matchesCategory = !selectedCategory || p.category === selectedCategory;

        const matchesStatus = !selectedStatus || p.status === selectedStatus;

        const matchesSeller = !selectedSeller || p.sellerType === selectedSeller;

        const matchesSearch =
          !q ||
          [p.name, p.code, p.sellerName, p.county, p.category].some((v) =>
            (v ?? '').toLowerCase().includes(q),
          );

        return matchesCategory && matchesStatus && matchesSeller && matchesSearch;
      })
      .sort((a, b) => Number(b.id) - Number(a.id));
  });

  // Calculate the number of pages.
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.rows().length / this.pageSize())),
  );

  // Products displayed on the current page only.
  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });

  protected readonly startItem = computed(() =>
    this.rows().length === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );

  protected readonly endItem = computed(() =>
    Math.min(this.page() * this.pageSize(), this.rows().length),
  );

  protected readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const end = Math.min(total, start + 4);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });

  // Reload image covers when the filtered products change.
  private readonly coverEffect = effect(() => {
    const products = this.paginatedRows();

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

  constructor() {
    this.service.ensureLoaded();
  }

  ngOnDestroy(): void {
    for (const url of this.imageUrls.values()) {
      this.imageLoader.revoke(url);
    }

    for (const objectUrl of Object.values(this.loadedCovers())) {
      URL.revokeObjectURL(objectUrl);
    }
  }

  // Reset to page one whenever a filter changes.
  protected setSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  protected setCategory(value: string): void {
    this.category.set(value);
    this.page.set(1);
  }

  protected setStatus(value: '' | ProductStatus): void {
    this.status.set(value);
    this.page.set(1);
  }

  protected setSellerType(value: SellerFilter): void {
    this.sellerType.set(value);
    this.page.set(1);
  }

  protected setPageSize(value: number): void {
    this.pageSize.set(value);
    this.page.set(1);
  }

  protected goToPage(value: number): void {
    if (value >= 1 && value <= this.totalPages()) {
      this.page.set(value);
    }
  }

  protected num(n: number): string {
    return n.toLocaleString('en-KE');
  }

  protected compact(n: number): string {
    return n >= 1e6
      ? (n / 1e6).toFixed(1) + 'M'
      : n >= 1e3
        ? Math.round(n / 1e3) + 'K'
        : '' + Math.round(n);
  }

  protected pct(): number {
    const s = this.stats();
    return s.total ? Math.round((s.live / s.total) * 100) : 0;
  }

  protected async confirm(reason: string): Promise<void> {
    const a = this.action();
    this.action.set(null);

    if (!a) return;

    if (a.type === 'delete') {
      await this.service.remove(a.product.id);
    } else {
      await this.service.suspend(a.product.id, reason);
    }

    // If the current page is now out of range, return to the last page.
    if (this.page() > this.totalPages()) {
      this.page.set(this.totalPages());
    }
  }
}
