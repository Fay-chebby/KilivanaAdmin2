import { Injectable, computed, inject, signal } from '@angular/core';

import {
  CategoryDto,
  FarmDto,
  ProductDto,
  ProductRequestDto,
  UserDto,
} from '../models/productsapi.model';

import {
  ChecklistItem,
  DEFAULT_CHECKLIST,
  GRADES,
  Grade,
  Product,
  ProductImage,
  ProductPayload,
  ProductStatus,
  ProductVerification,
  SellerType,
  VerificationStatus,
  stockState,
  visibility,
} from '../models/product.model';

import { ProductApi } from './product.api';

import { API_BASE } from '../../../core/config/api.config';

const abs = (url: string | null | undefined): string => {
  if (!url) return '';

  const cleanUrl = url.trim();

  if (!cleanUrl) return '';

  // Keep data URLs unchanged.
  if (/^data:/i.test(cleanUrl)) {
    return cleanUrl;
  }

  // Normalize absolute URLs that contain a duplicated API prefix.
  if (/^https?:\/\//i.test(cleanUrl)) {
    try {
      const parsed = new URL(cleanUrl);

      parsed.pathname = parsed.pathname.replace(/\/api\/v1\/api\/v1(?=\/|$)/g, '/api/v1');

      return parsed.toString();
    } catch {
      return cleanUrl;
    }
  }

  // The image path already contains the API prefix.
  if (cleanUrl.startsWith('/api/v1/')) {
    return `${API_BASE.replace(/\/api\/v1\/?$/, '')}${cleanUrl}`;
  }

  if (cleanUrl.startsWith('api/v1/')) {
    return `${API_BASE.replace(/\/api\/v1\/?$/, '')}/${cleanUrl}`;
  }

  // Other relative paths use the shared API base.
  return `${API_BASE}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
};

const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');

const STATUSES: ProductStatus[] = ['pending', 'active', 'rejected', 'suspended'];

const num = (v: unknown, fallback: number) =>
  typeof v === 'number' && isFinite(v)
    ? v
    : typeof v === 'string' && v !== '' && isFinite(+v)
      ? +v
      : fallback;

function errMsg(e: unknown): string {
  const x = e as {
    status?: number;
    message?: string;
    error?: { message?: string; error?: { details?: string } };
  };

  if (x?.status === 0) {
    return 'Cannot reach the server. Check the ngrok address and that the backend is running.';
  }

  if (x?.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (x?.status === 403) {
    return 'The server refused this action for your account (403). Check the admin permissions on the backend.';
  }

  return x?.error?.error?.details || x?.error?.message || x?.message || 'Something went wrong.';
}

/**
 * Products as the admin portal sees them, built from the Kilivana backend:
 * admin products + sellers + categories + farms.
 *
 * Product verification is handled directly by the admin through product
 * status updates. No inspector assignment or inspection record is required.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ProductApi);

  private readonly dtos = signal<ProductDto[]>([]);
  private readonly serverStats = signal<Record<string, unknown> | null>(null);
  private readonly farmers = signal<UserDto[]>([]);
  private readonly suppliers = signal<UserDto[]>([]);
  private readonly cats = signal<CategoryDto[]>([]);
  private readonly farmList = signal<FarmDto[]>([]);

  /** The backend has no field for the checklist, so it remains frontend state. */
  private readonly checklists = signal<Record<string, ChecklistItem[]>>({});

  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly warning = signal<string | null>(null);

  private loadPromise: Promise<void> | null = null;

  readonly categories = this.cats.asReadonly();
  readonly grades = GRADES;

  readonly farmOptions = computed(() =>
    this.farmList().map((f) => ({
      id: String(f.id),
      name: f.name,
      county: f.county ?? '',
      ownerId: f.farmerId !== undefined ? String(f.farmerId) : '',
    })),
  );

  readonly sellerOptions = computed(() => [
    ...this.farmers().map((u) => this.seller(u, 'farmer')),
    ...this.suppliers().map((u) => this.seller(u, 'supplier')),
  ]);

  /**
   * Converts backend products into the product model used by the UI.
   * Images come only from the farmer's submitted product images.
   */
  readonly products = computed<Product[]>(() => {
    const sellers = new Map(this.sellerOptions().map((s) => [Number(s.id), s]));

    const cats = new Map(this.cats().map((c) => [c.id, c.name]));

    const lists = this.checklists();

    return this.dtos().map((d) => {
      const seller = sellers.get(d.sellerId);
      const status = this.status(d.status);
      const id = String(d.id);

      const verification = this.verificationOf(status, lists[id], d.verifiedQty ?? null);

      const photos: ProductImage[] = [...(d.images ?? [])]
        .sort(
          (a, b) =>
            Number(!!b.isPrimary) - Number(!!a.isPrimary) ||
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
        )
        .map((image, index) => ({
          id: `p-${image.id}`,
          url: abs(image.url),
          caption: `Product photo ${index + 1}`,
          uploadedBy: 'farmer' as const,
          uploadedAt: day(image.createdAt),
        }));

      const listed = d.stockQty + (d.soldQty ?? 0);

      const grade = GRADES.find((g) => g.value === d.qualityGrade)?.value ?? null;

      return {
        id,
        code: `P-${id.padStart(3, '0')}`,
        name: d.name,

        category:
          d.categoryName ??
          (d.categoryId !== null ? (cats.get(d.categoryId) ?? 'Uncategorised') : 'Uncategorised'),

        categoryId: d.categoryId,
        description: d.description,

        sellerId: String(d.sellerId),
        sellerName: d.sellerName ?? seller?.name ?? `Seller #${d.sellerId}`,

        sellerType: (d.sellerType ?? '').toLowerCase() === 'supplier' ? 'supplier' : 'farmer',

        sellerPhone: d.sellerPhone ?? seller?.phone ?? '',
        county: d.sellerCounty ?? seller?.county ?? '',

        priceKes: Number(d.price),
        unit: d.unit,
        stock: d.stockQty,
        soldQty: d.soldQty ?? 0,
        minOrder: d.minimumOrderQty,

        lowStockAt: d.lowStockThreshold ?? Math.max(1, Math.ceil(listed * 0.1)),

        grade,
        harvestDate: d.harvestDate ? day(d.harvestDate) : null,
        farmId: d.farmId != null ? String(d.farmId) : null,
        farmName: d.farmName ?? null,
        farmCertified: !!d.farmCertified,

        status,
        statusReason: d.statusReason ?? '',

        // These are the farmer's existing uploaded photos.
        images: photos,

        verification,

        verifiedAt: d.verifiedAt
          ? day(d.verifiedAt)
          : status === 'active'
            ? day(d.statusChangedAt) || null
            : null,

        createdAt: day(d.createdAt),
      };
    });
  });

  /** Uses the server totals when available and calculates them otherwise. */
  readonly stats = computed(() => {
    const products = this.products();
    const live = products.filter((p) => visibility(p).live);

    const local = {
      total: products.length,
      live: live.length,
      liveValue: live.reduce((total, p) => total + p.priceKes * p.stock, 0),
      pending: products.filter((p) => p.status === 'pending').length,
      restock: products.filter((p) => p.status === 'active' && stockState(p) !== 'ok').length,
    };

    const server = this.serverStats();

    if (!server) return local;

    return {
      total: num(server['total'], local.total),
      live: num(server['live'], local.live),
      liveValue: num(server['liveStockValue'], local.liveValue),
      pending: num(server['pending'], local.pending),
      restock: num(server['needsRestock'], local.restock),
    };
  });

  getById(id: string) {
    return this.products().find((p) => p.id === id);
  }

  // ---------------- loading ----------------

  ensureLoaded(): Promise<void> {
    if (this.loaded()) {
      return Promise.resolve();
    }

    if (!this.loadPromise) {
      this.loadPromise = this.load().finally(() => {
        this.loadPromise = null;
      });
    }

    return this.loadPromise;
  }

  /** Reads the product and supporting data again. */
  async load(silent = false): Promise<void> {
    if (!silent) {
      this.loading.set(true);
    }

    this.error.set(null);

    const [p, st, f, s, c, fm] = await Promise.allSettled([
      this.api.listAllProducts(),
      this.api.getStats(),
      this.api.listUsers('FARMER'),
      this.api.listUsers('SUPPLIER'),
      this.api.listCategories(),
      this.api.listFarms(),
    ]);

    const missed: string[] = [];

    if (p.status === 'rejected') {
      this.error.set(errMsg(p.reason));
      this.loadPromise = null;
    } else {
      this.dtos.set(p.value.items ?? []);
      this.loaded.set(true);

      if (p.value.fallback) {
        missed.push(
          'the admin product list (showing the public list, which may hide pending and rejected products)',
        );
      }
    }

    if (st.status === 'fulfilled') {
      this.serverStats.set(st.value ?? null);
    } else {
      this.serverStats.set(null);
    }

    const take = <T>(
      result: PromiseSettledResult<T[]>,
      label: string,
      set: (value: T[]) => void,
    ) => {
      if (result.status === 'fulfilled') {
        set(result.value ?? []);
      } else {
        missed.push(label);
      }
    };

    take(f, 'farmers', (value) => this.farmers.set(value));
    take(s, 'suppliers', (value) => this.suppliers.set(value));
    take(c, 'categories', (value) => this.cats.set(value));
    take(fm, 'farms', (value) => this.farmList.set(value));

    this.warning.set(
      missed.length ? `Some details could not be loaded: ${missed.join(', ')}.` : null,
    );

    this.loading.set(false);
  }

  // ---------------- products ----------------

  async create(p: ProductPayload): Promise<Product | null> {
    const created = await this.run(() => this.api.createProduct(this.toRequest(p), p.newFiles));

    if (!created) return null;

    await this.load(true);

    return this.getById(String(created.id)) ?? null;
  }

  async update(id: string, p: ProductPayload): Promise<boolean> {
    const current = this.getById(id);

    if (!current) return false;

    const ok = await this.run(async () => {
      await this.api.updateProduct(Number(id), this.toRequest(p));

      const keep = new Set(p.keptImageIds);

      for (const image of current.images.filter(
        (image) => image.uploadedBy === 'farmer' && !keep.has(image.id),
      )) {
        await this.api.deleteProductImage(Number(id), Number(image.id.slice(2)));
      }

      for (const file of p.newFiles) {
        await this.api.uploadProductImage(Number(id), file);
      }

      return true;
    });

    if (ok) {
      await this.load(true);
    }

    return !!ok;
  }

  async remove(id: string): Promise<boolean> {
    const ok = await this.run(() => this.api.deleteProduct(Number(id)).then(() => true));

    if (ok) {
      await this.load(true);
    }

    return !!ok;
  }

  private async changeStatus(
    id: string,
    status: ProductStatus,
    reason?: string,
    extra: Record<string, unknown> = {},
  ): Promise<boolean> {
    const ok = await this.run(() =>
      this.api.setProductStatus(Number(id), status.toUpperCase(), reason, extra).then(() => true),
    );

    if (ok) {
      await this.load(true);
    }

    return !!ok;
  }

  suspend(id: string, reason: string) {
    return this.changeStatus(id, 'suspended', reason);
  }

  reactivate(id: string) {
    return this.changeStatus(id, 'active', 'Reactivated by an admin');
  }

  /** Returns a product to pending status for another admin review. */
  resubmit(id: string) {
    return this.changeStatus(id, 'pending', 'Sent back for admin review');
  }

  // ---------------- direct admin verification ----------------

  /** Toggles an item on the local admin review checklist. */
  toggleCheck(productId: string, key: string) {
    const current = this.checklists()[productId] ?? DEFAULT_CHECKLIST.map((item) => ({ ...item }));

    this.checklists.update((lists) => ({
      ...lists,
      [productId]: current.map((item) =>
        item.key === key ? { ...item, checked: !item.checked } : item,
      ),
    }));
  }

  /**
   * Deletes a farmer-uploaded product image.
   * No inspection evidence images are used in this workflow.
   */
  async removeImage(productId: string, imageId: string): Promise<boolean> {
    if (!imageId.startsWith('p-')) {
      this.error.set('Only farmer-uploaded product images can be removed here.');
      return false;
    }

    const imageNumber = Number(imageId.slice(2));

    if (!Number.isFinite(imageNumber)) {
      this.error.set('Invalid product image ID.');
      return false;
    }

    const ok = await this.run(async () => {
      await this.api.deleteProductImage(Number(productId), imageNumber);
      return true;
    });

    if (ok) {
      await this.load(true);
    }

    return !!ok;
  }

  /**
   * Approves or rejects a product directly.
   * Does not create, update, or require an inspection record.
   */

  /**
   * Approves or rejects a product directly.
   * Does not create, update, or require an inspection record.
   */
  async decide(
    productId: string,
    result: 'approved' | 'rejected',
    details: {
      notes: string;
      qty: number;
      grade: Grade;
    },
  ): Promise<boolean> {
    const product = this.getById(productId);

    if (!product) {
      this.error.set('Product not found.');
      return false;
    }

    const approved = result === 'approved';

    if (approved && details.qty <= 0) {
      this.error.set('The verified quantity must be greater than zero.');
      return false;
    }

    if (approved && product.images.length === 0) {
      this.error.set(
        'This product has no uploaded photos. Ask the farmer to upload photos before approving.',
      );
      return false;
    }

    const status: ProductStatus = approved ? 'active' : 'rejected';

    const reason =
      details.notes.trim() ||
      (approved
        ? 'Approved by admin after reviewing the submitted product details and photos.'
        : 'Rejected by admin.');

    const ok = await this.run(async () => {
      // IMPORTANT: Send uppercase enum values to Spring Boot.
      await this.api.setProductStatus(
        Number(productId),
        this.toApiStatus(status),
        reason,
        approved ? { verifiedQty: details.qty } : {},
      );

      // Update quantity and quality grade if approval succeeded.
      if (approved && (details.qty !== product.stock || details.grade !== product.grade)) {
        try {
          await this.api.updateProduct(Number(productId), {
            ...this.requestFrom(product),
            stockQty: Math.min(product.stock, details.qty),
            qualityGrade: details.grade,
          });
        } catch {
          this.warning.set(
            'The product was approved, but its quantity or grade could not be updated. Please edit the product and try again.',
          );
        }
      }

      return true;
    });

    if (!ok) {
      return false;
    }

    await this.load(true);

    return true;
  }

  /** Returns an approved or rejected product to pending admin review. */
  async reopen(productId: string): Promise<boolean> {
    return this.changeStatus(productId, 'pending', 'Returned for admin review');
  }

  // ---------------- helpers ----------------

  private async run<T>(fn: () => Promise<T>): Promise<T | null> {
    this.busy.set(true);
    this.error.set(null);

    try {
      return await fn();
    } catch (error: unknown) {
      this.error.set(errMsg(error));
      return null;
    } finally {
      this.busy.set(false);
    }
  }

  private seller(u: UserDto, type: SellerType) {
    return {
      id: String(u.id),
      name: u.name,
      phone: u.phone ?? '',
      county: u.region ?? '',
      type,
    };
  }

  private status(value: string): ProductStatus {
    const normalized = (value ?? '').toLowerCase() as ProductStatus;

    return STATUSES.includes(normalized) ? normalized : 'pending';
  }

  private toRequest(p: ProductPayload): ProductRequestDto {
    const seller = this.sellerOptions().find((option) => option.id === p.sellerId);

    return {
      sellerId: Number(p.sellerId),
      sellerType: seller?.type ?? 'farmer',
      categoryId: p.categoryId,
      name: p.name.trim(),
      description: p.description.trim(),
      unit: p.unit,
      price: p.priceKes,
      stockQty: p.stock,
      minimumOrderQty: p.minOrder,
      qualityGrade: p.grade,
      harvestDate: p.harvestDate || null,
      lowStockThreshold: p.lowStockAt,
      farmId: p.farmId ? Number(p.farmId) : null,
    };
  }

  private requestFrom(p: Product): ProductRequestDto {
    return {
      sellerId: Number(p.sellerId),
      sellerType: p.sellerType,
      categoryId: p.categoryId,
      name: p.name,
      description: p.description,
      unit: p.unit,
      price: p.priceKes,
      stockQty: p.stock,
      minimumOrderQty: p.minOrder,
      qualityGrade: p.grade ?? 'GRADE_A',
      harvestDate: p.harvestDate,
      lowStockThreshold: p.lowStockAt,
      farmId: p.farmId ? Number(p.farmId) : null,
    };
  }
  private toApiStatus(status: ProductStatus): string {
    return status.toUpperCase();
  }
  /** Maps the product's status to the status expected by the verification UI. */
  private verificationOf(
    status: ProductStatus,
    localChecklist: ChecklistItem[] | undefined,
    serverQty: number | null,
  ): ProductVerification {
    let verificationStatus: VerificationStatus = 'unassigned';

    if (status === 'active') {
      verificationStatus = 'approved';
    } else if (status === 'rejected') {
      verificationStatus = 'rejected';
    }

    return {
      status: verificationStatus,
      inspectionId: null,
      inspectorId: null,
      inspectorName: null,
      assignedAt: null,
      notes: '',
      checklist: localChecklist ?? DEFAULT_CHECKLIST.map((item) => ({ ...item })),
      verifiedQty: serverQty,
      decidedAt: null,
    };
  }
}
