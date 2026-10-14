import { Injectable, computed, inject, signal } from '@angular/core';

import {
  CategoryDto,
  FarmDto,
  ImageDto,
  InspectionDto,
  InspectionRequestDto,
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
const API_URL = '  https://either-juvenile-progeny.ngrok-free.dev';

const abs = (u: string) =>
  /^(https?:|data:)/i.test(u) ? u : API_URL + (u.startsWith('/') ? '' : '/') + u;
const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');
const STATUSES: ProductStatus[] = ['pending', 'active', 'rejected', 'suspended'];
const COUNT_RE = /\n?\[Counted: ([\d.,]+)[^\]]*\]\s*$/;
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
  if (x?.status === 0)
    return 'Cannot reach the server. Check the ngrok address and that the backend is running.';
  if (x?.status === 401) return 'Your session has expired. Please sign in again.';
  if (x?.status === 403)
    return 'The server refused this action for your account (403). The backend may still restrict it to the product owner.';
  return x?.error?.message || x?.error?.error?.details || x?.message || 'Something went wrong.';
}

/**
 * Products as the admin portal sees them, built from the Kilivana backend:
 *  admin products + sellers + categories + farms + inspections.
 * Verification is an Inspection with targetType PRODUCT.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ProductApi);

  private readonly dtos = signal<ProductDto[]>([]);
  private readonly serverStats = signal<Record<string, unknown> | null>(null);
  private readonly farmers = signal<UserDto[]>([]);
  private readonly suppliers = signal<UserDto[]>([]);
  private readonly inspectorUsers = signal<UserDto[]>([]);
  private readonly cats = signal<CategoryDto[]>([]);
  private readonly farmList = signal<FarmDto[]>([]);
  private readonly inspections = signal<InspectionDto[]>([]);
  private readonly evidence = signal<Record<number, ImageDto[]>>({});
  /** The backend has no field for the checklist, so it lives here until the decision is made */
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

  readonly inspectorCandidates = computed(() =>
    this.inspectorUsers()
      .filter((u) => (u.status ?? '').toUpperCase() === 'ACTIVE')
      .map((u) => ({
        id: String(u.id),
        name: u.name,
        region: u.region ?? '',
        detail: u.region || 'No county on file',
        pending: this.inspections().filter(
          (i) =>
            i.inspectorId === u.id &&
            ['ASSIGNED', 'PENDING', 'IN_PROGRESS'].includes((i.status ?? '').toUpperCase()),
        ).length,
      })),
  );

  readonly products = computed<Product[]>(() => {
    const sellers = new Map(this.sellerOptions().map((s) => [Number(s.id), s]));
    const cats = new Map(this.cats().map((c) => [c.id, c.name]));
    const inspectors = new Map(this.inspectorUsers().map((u) => [u.id, u.name]));
    const latest = new Map<number, InspectionDto>();
    for (const i of this.inspections()) {
      if ((i.targetType ?? '').toUpperCase() !== 'PRODUCT') continue;
      const cur = latest.get(i.targetId);
      if (!cur || i.id > cur.id) latest.set(i.targetId, i);
    }
    const ev = this.evidence();
    const lists = this.checklists();

    return this.dtos().map((d) => {
      const s = sellers.get(d.sellerId);
      const insp = latest.get(d.id);
      const status = this.status(d.status);
      const id = String(d.id);
      const verification = this.verificationOf(
        status,
        insp,
        inspectors,
        lists[id],
        d.verifiedQty ?? null,
      );
      const photos: ProductImage[] = [...(d.images ?? [])]
        .sort(
          (a, b) =>
            Number(!!b.isPrimary) - Number(!!a.isPrimary) ||
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
        )
        .map((i, n) => ({
          id: `p-${i.id}`,
          url: abs(i.url),
          caption: `Product photo ${n + 1}`,
          uploadedBy: 'farmer' as const,
          uploadedAt: day(i.createdAt),
        }));
      const onSite: ProductImage[] = insp
        ? (ev[insp.id] ?? []).map((i, n) => ({
            id: `e-${i.id}`,
            url: abs(i.url),
            caption: `On-site photo ${n + 1}`,
            uploadedBy: 'inspector' as const,
            uploadedAt: day(i.createdAt),
          }))
        : [];
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
        sellerName: d.sellerName ?? s?.name ?? `Seller #${d.sellerId}`,
        sellerType: (d.sellerType ?? '').toLowerCase() === 'supplier' ? 'supplier' : 'farmer',
        sellerPhone: d.sellerPhone ?? s?.phone ?? '',
        county: d.sellerCounty ?? s?.county ?? '',
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
        images: [...photos, ...onSite],
        verification,
        verifiedAt: d.verifiedAt
          ? day(d.verifiedAt)
          : verification.status === 'approved'
            ? day(insp?.inspectedAt ?? insp?.updatedAt) || null
            : null,
        createdAt: day(d.createdAt),
      };
    });
  });

  /** Uses the server's own totals when it sends them, and works them out here otherwise */
  readonly stats = computed(() => {
    const l = this.products();
    const live = l.filter((p) => visibility(p).live);
    const local = {
      total: l.length,
      live: live.length,
      liveValue: live.reduce((a, p) => a + p.priceKes * p.stock, 0),
      pending: l.filter((p) => p.status === 'pending').length,
      restock: l.filter((p) => p.status === 'active' && stockState(p) !== 'ok').length,
    };
    const s = this.serverStats();
    if (!s) return local;
    return {
      total: num(s['total'], local.total),
      live: num(s['live'], local.live),
      liveValue: num(s['liveStockValue'], local.liveValue),
      pending: num(s['pending'], local.pending),
      restock: num(s['needsRestock'], local.restock),
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

  /** Reads everything again. `silent` skips the loading bar (used after an action). */
  async load(silent = false): Promise<void> {
    if (!silent) this.loading.set(true);
    this.error.set(null);
    const [p, st, f, s, i, c, n, fm] = await Promise.allSettled([
      this.api.listAllProducts(),
      this.api.getStats(),
      this.api.listUsers('FARMER'),
      this.api.listUsers('SUPPLIER'),
      this.api.listUsers('INSPECTOR'),
      this.api.listCategories(),
      this.api.listInspections(),
      this.api.listFarms(),
    ]);
    const missed: string[] = [];
    if (p.status === 'rejected') {
      this.error.set(errMsg(p.reason));
      this.loadPromise = null;
    } else {
      this.dtos.set(p.value.items ?? []);
      this.loaded.set(true);
      if (p.value.fallback)
        missed.push(
          'the admin product list (showing the public list, which may hide pending and rejected products)',
        );
    }
    if (st.status === 'fulfilled') this.serverStats.set(st.value ?? null);
    else this.serverStats.set(null);
    const take = <T>(r: PromiseSettledResult<T[]>, label: string, set: (v: T[]) => void) => {
      if (r.status === 'fulfilled') set(r.value ?? []);
      else missed.push(label);
    };
    take(f, 'farmers', (v) => this.farmers.set(v));
    take(s, 'suppliers', (v) => this.suppliers.set(v));
    take(i, 'inspectors', (v) => this.inspectorUsers.set(v));
    take(c, 'categories', (v) => this.cats.set(v));
    take(n, 'inspections', (v) => this.inspections.set(v));
    take(fm, 'farms', (v) => this.farmList.set(v));
    this.warning.set(
      missed.length ? `Some details could not be loaded: ${missed.join(', ')}.` : null,
    );
    this.loading.set(false);
  }

  /** Fetches the on-site photos of a product's latest inspection */
  async loadEvidence(productId: string) {
    const insp = this.latestInspection(Number(productId));
    if (!insp) return;
    try {
      const imgs = await this.api.listEvidence(insp.id);
      this.evidence.update((m) => ({ ...m, [insp.id]: imgs ?? [] }));
    } catch {
      /* photos are optional, the page still works without them */
    }
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
      for (const img of current.images.filter(
        (i) => i.uploadedBy === 'farmer' && !keep.has(i.id),
      )) {
        await this.api.deleteProductImage(Number(id), Number(img.id.slice(2)));
      }
      for (const f of p.newFiles) await this.api.uploadProductImage(Number(id), f);
      return true;
    });
    if (ok) await this.load(true);
    return !!ok;
  }

  async remove(id: string): Promise<boolean> {
    const ok = await this.run(() => this.api.deleteProduct(Number(id)).then(() => true));
    if (ok) await this.load(true);
    return !!ok;
  }

  private async changeStatus(
    id: string,
    status: ProductStatus,
    reason?: string,
    extra: Record<string, unknown> = {},
  ): Promise<boolean> {
    const ok = await this.run(() =>
      this.api.setProductStatus(Number(id), status, reason, extra).then(() => true),
    );
    if (ok) await this.load(true);
    return !!ok;
  }
  suspend(id: string, reason: string) {
    return this.changeStatus(id, 'suspended', reason);
  }
  reactivate(id: string) {
    return this.changeStatus(id, 'active', 'Reactivated by an admin');
  }
  /** Back to pending: a new inspection is needed before it can go live again */
  resubmit(id: string) {
    return this.changeStatus(id, 'pending', 'Sent back for verification');
  }

  // ---------------- verification (inspections) ----------------
  async assign(productId: string, inspectorId: string): Promise<boolean> {
    const ok = await this.run(async () => {
      await this.api.createInspection({
        inspectorId: Number(inspectorId),
        targetType: 'PRODUCT',
        targetId: Number(productId),
        status: 'ASSIGNED',
      });
      if (this.getById(productId)?.status !== 'pending')
        await this.api.setProductStatus(Number(productId), 'pending', 'Sent for verification');
      return true;
    });
    if (ok) await this.load(true);
    return !!ok;
  }

  async startCheck(productId: string): Promise<boolean> {
    const insp = this.latestInspection(Number(productId));
    if (!insp) return false;
    const ok = await this.run(() =>
      this.api.setInspectionStatus(insp.id, 'IN_PROGRESS').then(() => true),
    );
    if (ok) await this.load(true);
    return !!ok;
  }

  toggleCheck(productId: string, key: string) {
    const cur = this.checklists()[productId] ?? DEFAULT_CHECKLIST.map((c) => ({ ...c }));
    this.checklists.update((m) => ({
      ...m,
      [productId]: cur.map((c) => (c.key === key ? { ...c, checked: !c.checked } : c)),
    }));
  }

  async addInspectorPhotos(productId: string, files: File[]): Promise<boolean> {
    const insp = this.latestInspection(Number(productId));
    if (!insp) return false;
    const ok = await this.run(async () => {
      for (const f of files) await this.api.uploadEvidence(insp.id, f);
      return true;
    });
    await this.loadEvidence(productId);
    return !!ok;
  }

  async removeImage(productId: string, imageId: string): Promise<boolean> {
    const n = Number(imageId.slice(2));
    const insp = this.latestInspection(Number(productId));
    const ok = await this.run(async () => {
      if (imageId.startsWith('e-') && insp) await this.api.deleteEvidence(insp.id, n);
      else await this.api.deleteProductImage(Number(productId), n);
      return true;
    });
    if (ok) {
      await this.load(true);
      await this.loadEvidence(productId);
    }
    return !!ok;
  }

  /**
   * Saves the inspector's decision:
   *  1. completes the inspection (the counted quantity goes into its notes, because inspections have no field for it)
   *  2. sets the product to active or rejected, with the reason, and sends the counted quantity along
   *  3. when approving, lowers stock to what was counted and applies the grade the inspector confirmed
   */
  async decide(
    productId: string,
    result: 'approved' | 'rejected',
    d: { notes: string; qty: number; grade: Grade },
  ): Promise<boolean> {
    const p = this.getById(productId);
    const insp = this.latestInspection(Number(productId));
    if (!p || !insp) {
      this.error.set('There is no inspection for this product yet.');
      return false;
    }
    const body: InspectionRequestDto = {
      inspectorId: insp.inspectorId,
      targetType: 'PRODUCT',
      targetId: Number(productId),
      status: 'COMPLETED',
      notes: `${d.notes}\n[Counted: ${d.qty} ${p.unit}]`.trim(),
    };
    const extra = { verifiedQty: d.qty, lastInspectionId: insp.id, inspectionId: insp.id };
    const ok = await this.run(async () => {
      await this.api.submitInspectionResult(
        insp.id,
        result === 'approved' ? 'APPROVED' : 'REJECTED',
        body,
      );
      await this.api.setInspectionStatus(insp.id, 'COMPLETED').catch(() => undefined);
      await this.api.setProductStatus(
        Number(productId),
        result === 'approved' ? 'active' : 'rejected',
        d.notes || (result === 'approved' ? 'Verified on site' : 'Failed verification'),
        extra,
      );
      return true;
    });
    if (!ok) return false;
    if (result === 'approved' && (d.qty < p.stock || d.grade !== p.grade)) {
      try {
        await this.api.updateProduct(Number(productId), {
          ...this.requestFrom(p),
          stockQty: Math.min(p.stock, d.qty),
          qualityGrade: d.grade,
        });
      } catch {
        this.warning.set(
          'The product is approved, but its stock and grade could not be updated to what the inspector found. Please edit the product by hand.',
        );
      }
    }
    await this.load(true);
    await this.loadEvidence(productId);
    return true;
  }

  async reopen(productId: string): Promise<boolean> {
    const insp = this.latestInspection(Number(productId));
    if (!insp) return false;
    const ok = await this.run(async () => {
      await this.api.setInspectionStatus(insp.id, 'IN_PROGRESS');
      await this.api.setProductStatus(Number(productId), 'pending', 'Verification reopened');
      return true;
    });
    if (ok) await this.load(true);
    return !!ok;
  }

  // ---------------- helpers ----------------
  private async run<T>(fn: () => Promise<T>): Promise<T | null> {
    this.busy.set(true);
    this.error.set(null);
    try {
      return await fn();
    } catch (e) {
      this.error.set(errMsg(e));
      return null;
    } finally {
      this.busy.set(false);
    }
  }

  private seller(u: UserDto, type: SellerType) {
    return { id: String(u.id), name: u.name, phone: u.phone ?? '', county: u.region ?? '', type };
  }

  private status(s: string): ProductStatus {
    const v = (s ?? '').toLowerCase() as ProductStatus;
    return STATUSES.includes(v) ? v : 'pending';
  }

  private latestInspection(productId: number): InspectionDto | undefined {
    let best: InspectionDto | undefined;
    for (const i of this.inspections()) {
      if (
        (i.targetType ?? '').toUpperCase() === 'PRODUCT' &&
        i.targetId === productId &&
        (!best || i.id > best.id)
      )
        best = i;
    }
    return best;
  }

  private toRequest(p: ProductPayload): ProductRequestDto {
    const s = this.sellerOptions().find((x) => x.id === p.sellerId);
    return {
      sellerId: Number(p.sellerId),
      sellerType: s?.type ?? 'farmer',
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

  /** Turns the latest inspection into the status the verification panel understands */
  private verificationOf(
    status: ProductStatus,
    insp: InspectionDto | undefined,
    names: Map<number, string>,
    local: ChecklistItem[] | undefined,
    serverQty: number | null,
  ): ProductVerification {
    let v: VerificationStatus = 'unassigned';
    if (insp) {
      const s = (insp.status ?? '').toUpperCase();
      const r = (insp.result ?? '').toUpperCase();
      if (s === 'ASSIGNED' || s === 'PENDING') v = 'assigned';
      else if (s === 'IN_PROGRESS') v = 'in_review';
      else if (s === 'COMPLETED')
        v =
          r === 'APPROVED'
            ? 'approved'
            : r === 'REJECTED' || r === 'CHANGES_REQUIRED'
              ? 'rejected'
              : status === 'active'
                ? 'approved'
                : 'rejected';
      // sent back for verification: the old result no longer counts
      if (status === 'pending' && (v === 'approved' || v === 'rejected')) v = 'unassigned';
    } else if (status === 'active') v = 'approved';
    const raw = insp?.notes ?? '';
    const m = COUNT_RE.exec(raw);
    return {
      status: v,
      inspectionId: insp ? String(insp.id) : null,
      inspectorId: insp ? String(insp.inspectorId) : null,
      inspectorName: insp
        ? (names.get(insp.inspectorId) ?? `Inspector #${insp.inspectorId}`)
        : null,
      assignedAt: insp ? day(insp.createdAt) || null : null,
      notes: raw.replace(COUNT_RE, '').trim(),
      checklist:
        local ??
        (v === 'assigned' || v === 'in_review' ? DEFAULT_CHECKLIST.map((c) => ({ ...c })) : []),
      verifiedQty: serverQty ?? (m ? Number(m[1].replace(/,/g, '')) : null),
      decidedAt:
        v === 'approved' || v === 'rejected'
          ? day(insp?.inspectedAt ?? insp?.updatedAt) || null
          : null,
    };
  }
}
