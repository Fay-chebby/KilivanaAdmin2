import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
import {
  ApiEnvelope,
  ApiFarmerProfile,
  ApiUser,
  Farmer,
  FarmerAction,
  FarmerDetail,
  FarmerFormValue,
  FarmerStats,
  toFarmer,
  toProfile,
} from '../models/farmer.model';

/** Change this to your environment base URL if you don't use a proxy. */
const API = '/api/v1';

/**
 * ⚠ ASSUMED request bodies. The Swagger responses were provided, but not these request schemas.
 * Check them against the API and edit here only.
 */
const ACTION_BODY: Record<FarmerAction, (reason: string) => Record<string, unknown>> = {
  approve: () => ({ status: 'ACTIVE', verificationStatus: 'VERIFIED' }),
  reject: (reason) => ({ verificationStatus: 'REJECTED', reason }),
  suspend: (reason) => ({ status: 'SUSPENDED', reason }),
  reinstate: () => ({ status: 'ACTIVE' }),
};

export function apiError(e: unknown): string {
  const err = e as HttpErrorResponse;
  return (
    err?.error?.error?.details ||
    err?.error?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

const toName = (x: unknown): string =>
  typeof x === 'string'
    ? x
    : String(
        (x as Record<string, unknown>)?.['name'] ??
          (x as Record<string, unknown>)?.['county'] ??
          '',
      );

@Injectable({ providedIn: 'root' })
export class FarmerService {
  private readonly http = inject(HttpClient);

  private readonly _farmers = signal<Farmer[]>([]);
  readonly farmers = this._farmers.asReadonly();
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly stats = computed<FarmerStats>(() => {
    const l = this._farmers();
    const n = (s: Farmer['status']) => l.filter((f) => f.status === s).length;
    return {
      total: l.length,
      verified: n('verified'),
      pending: n('pending'),
      suspended: n('suspended'),
    };
  });

  /** GET /admin/users/role/FARMER */
  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.http.get<ApiEnvelope<ApiUser[]>>(`${API}/admin/users/role/FARMER`).subscribe({
      next: (r) => {
        this._farmers.set((r.data ?? []).map(toFarmer));
        this.loading.set(false);
      },
      error: (e) => {
        this.loadError.set(apiError(e));
        this.loading.set(false);
      },
    });
  }

  /** GET /admin/users/{id} + GET /profiles/farmers/{id} (profile may not exist yet) */
  getDetail(id: string): Observable<FarmerDetail> {
    return forkJoin({
      user: this.http.get<ApiEnvelope<ApiUser>>(`${API}/admin/users/${id}`),
      profile: this.http.get<ApiEnvelope<ApiFarmerProfile>>(`${API}/profiles/farmers/${id}`).pipe(
        map((r) => (r.data ? toProfile(r.data) : null)),
        catchError(() => of(null)),
      ),
    }).pipe(map(({ user, profile }) => ({ ...toFarmer(user.data), profile })));
  }

  /** GET /regions */
  regions(): Observable<string[]> {
    return this.http
      .get<ApiEnvelope<unknown[]>>(`${API}/regions`)
      .pipe(map((r) => (Array.isArray(r.data) ? r.data : []).map(toName).filter(Boolean)));
  }

  /** POST /admin/users, then POST /profiles/farmers/{id} */
  create(v: FarmerFormValue): Observable<Farmer> {
    const body = {
      name: v.name,
      email: v.email,
      phone: v.phone,
      username: v.username,
      password: v.password,
      region: v.region,
      role: 'FARMER',
    };
    return this.http.post<ApiEnvelope<ApiUser>>(`${API}/admin/users`, body).pipe(
      switchMap((r) =>
        this.http
          .post(`${API}/profiles/farmers/${r.data.id}`, this.profileBody(v))
          .pipe(map(() => toFarmer(r.data))),
      ),
      tap((f) => this._farmers.update((l) => [f, ...l])),
    );
  }

  /** PUT /admin/users/{id}, then PUT /profiles/farmers/{id} (falls back to POST if no profile yet) */
  update(id: string, v: FarmerFormValue): Observable<Farmer> {
    const body = { name: v.name, email: v.email, phone: v.phone, region: v.region };
    return this.http.put<ApiEnvelope<ApiUser>>(`${API}/admin/users/${id}`, body).pipe(
      switchMap((r) =>
        this.http.put(`${API}/profiles/farmers/${id}`, this.profileBody(v)).pipe(
          catchError((e: HttpErrorResponse) =>
            e.status === 404
              ? this.http.post(`${API}/profiles/farmers/${id}`, this.profileBody(v))
              : throwError(() => e),
          ),
          map(() => toFarmer(r.data)),
        ),
      ),
      tap((f) => this.patchLocal(f)),
    );
  }

  /** PATCH /admin/users/{id}/status */
  applyAction(id: string, action: FarmerAction, reason = ''): Observable<Farmer> {
    return this.http
      .patch<ApiEnvelope<ApiUser>>(`${API}/admin/users/${id}/status`, ACTION_BODY[action](reason))
      .pipe(
        map((r) => toFarmer(r.data)),
        tap((f) => this.patchLocal(f)),
      );
  }

  private profileBody(v: FarmerFormValue) {
    return { farmName: v.farmName, location: v.location, farmDetails: v.farmDetails };
  }
  private patchLocal(f: Farmer) {
    this._farmers.update((l) => l.map((x) => (x.id === f.id ? f : x)));
  }
}
