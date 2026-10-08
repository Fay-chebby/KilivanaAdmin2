import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, map, switchMap, tap, of } from 'rxjs';
import {
  AdminSupplierDto,
  ApiEnvelope,
  SUPPLIER_CATEGORIES,
  Supplier,
  SupplierCategory,
  SupplierFormValue,
  SupplierStatus,
} from '../models/supplier.model';

const API = '/api/v1';

export function errorMessage(err: unknown): string {
  const e = err as {
    status?: number;
    error?: { message?: string; error?: { details?: string; code?: string } };
    message?: string;
  };
  return (
    e?.error?.error?.details ||
    e?.error?.message ||
    e?.error?.error?.code ||
    (e?.status === 0
      ? 'Cannot reach the server.'
      : e?.status
        ? `Request failed (${e.status}).`
        : e?.message || 'Something went wrong.')
  );
}

function toStatus(s?: string | null): SupplierStatus {
  const v = (s ?? '').toLowerCase();
  return v === 'active' || v === 'suspended' ? v : 'pending';
}

export function toSupplier(d: AdminSupplierDto): Supplier {
  return {
    id: d.userId,
    profileId: d.profileId ?? null,
    code: d.code || `S-${String(d.userId).padStart(3, '0')}`,
    name: d.companyName,
    username: d.username ?? '',
    category: (d.category ?? 'Other') as SupplierCategory,
    contactPerson: d.contactPerson ?? '',
    email: d.email ?? '',
    phone: d.phone ?? '',
    region: d.region ?? '',
    address: d.address ?? '',
    contractEnd: d.contractEndDate || null,
    status: toStatus(d.status),
    suspensionReason: d.suspensionReason || null,
    productsCount: d.productsCount ?? 0,
    rating: d.rating ?? null,
    createdAt: (d.createdAt ?? '').slice(0, 10),
  };
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly http = inject(HttpClient);

  private readonly _suppliers = signal<Supplier[]>([]);
  readonly suppliers = this._suppliers.asReadonly();
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  /** Kenyan counties from GET /regions */
  readonly regions = signal<string[]>([]);
  /** Categories shown in the form; the API takes any string */
  readonly categories: readonly string[] = SUPPLIER_CATEGORIES;

  readonly notice = signal<string | null>(null);
  private noticeTimer?: ReturnType<typeof setTimeout>;

  // ---------- loading ----------
  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.http
      .get<ApiEnvelope<AdminSupplierDto[] | { content: AdminSupplierDto[] }>>(
        `${API}/admin/suppliers`,
      )
      .pipe(
        map((r) => (Array.isArray(r.data) ? r.data : (r.data?.content ?? []))),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (list) => this._suppliers.set(list.map(toSupplier)),
        error: (e) => this.loadError.set(errorMessage(e)),
      });
  }

  loadRegions(): void {
    if (this.regions().length) return;
    this.http.get<ApiEnvelope<string[]>>(`${API}/regions`).subscribe({
      next: (r) => this.regions.set(r.data ?? []),
      error: () => undefined,
    });
  }

  get$(id: number): Observable<Supplier> {
    return this.http.get<ApiEnvelope<AdminSupplierDto>>(`${API}/admin/suppliers/${id}`).pipe(
      map((r) => toSupplier(r.data)),
      tap((s) => this.upsert(s)),
    );
  }

  /** Only checks suppliers already loaded. The server still enforces uniqueness. */
  usernameTaken(username: string, excludeId?: number): boolean {
    const u = username.trim().toLowerCase();
    return this._suppliers().some((s) => s.id !== excludeId && s.username.toLowerCase() === u);
  }

  // ---------- actions ----------
  create$(v: SupplierFormValue): Observable<Supplier> {
    return this.http
      .post<ApiEnvelope<AdminSupplierDto>>(`${API}/admin/suppliers`, this.body(v, true))
      .pipe(
        map((r) => toSupplier(r.data)),
        // The API starts new suppliers as pending. If the admin picked "Active", activate right away.
        switchMap((s) =>
          v.status === 'active' && s.status !== 'active'
            ? this.http
                .put(`${API}/admin/users/${s.id}/activate`, null)
                .pipe(map(() => ({ ...s, status: 'active' as const })))
            : of(s),
        ),
        tap((s) => {
          this.upsert(s);
          this.flash(`${s.name} registered successfully.`);
        }),
      );
  }

  update$(id: number, v: SupplierFormValue): Observable<Supplier> {
    return this.http
      .put<ApiEnvelope<AdminSupplierDto>>(`${API}/admin/suppliers/${id}`, this.body(v, false))
      .pipe(
        map((r) => toSupplier(r.data)),
        tap((s) => {
          this.upsert(s);
          this.flash('Supplier updated successfully.');
        }),
      );
  }

  delete$(s: Supplier): Observable<unknown> {
    return this.http.delete(`${API}/admin/suppliers/${s.id}`).pipe(
      tap(() => {
        this._suppliers.update((l) => l.filter((x) => x.id !== s.id));
        this.flash(`${s.name} was deleted.`);
      }),
    );
  }

  suspend$(s: Supplier, reason: string): Observable<unknown> {
    return this.http
      .put(`${API}/admin/suppliers/${s.id}/suspend`, null, { params: { reason } })
      .pipe(
        tap(() => {
          this.upsert({ ...s, status: 'suspended', suspensionReason: reason });
          this.flash('Supplier suspended.');
        }),
      );
  }

  /** "Reinstate" (suspended) uses unsuspend. "Activate" (pending) uses the generic user activate. */
  activate$(s: Supplier): Observable<unknown> {
    const call$ =
      s.status === 'suspended'
        ? this.http.put(`${API}/admin/suppliers/${s.id}/unsuspend`, null)
        : this.http.put(`${API}/admin/users/${s.id}/activate`, null);
    return call$.pipe(
      tap(() => {
        this.upsert({ ...s, status: 'active', suspensionReason: null });
        this.flash('Supplier is now active.');
      }),
    );
  }

  // ---------- internals ----------
  /** Blank password is left out, so the API keeps the current one. */
  private body(v: SupplierFormValue, creating: boolean) {
    const b: Record<string, unknown> = {
      companyName: v.name.trim(),
      contactPerson: v.contactPerson.trim(),
      username: v.username.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      region: v.region,
      address: v.address.trim(),
      category: v.category,
    };
    if (v.contractEnd) b['contractEndDate'] = v.contractEnd;
    if (creating) b['status'] = v.status;
    if (v.password) b['password'] = v.password;
    return b;
  }

  private upsert(s: Supplier): void {
    this._suppliers.update((l) =>
      l.some((x) => x.id === s.id) ? l.map((x) => (x.id === s.id ? s : x)) : [s, ...l],
    );
  }

  flash(message: string): void {
    clearTimeout(this.noticeTimer);
    this.notice.set(message);
    this.noticeTimer = setTimeout(() => this.notice.set(null), 3500);
  }
}
