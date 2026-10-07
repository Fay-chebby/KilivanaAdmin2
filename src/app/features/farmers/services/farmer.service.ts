import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
import {
  ApiEnvelope,
  ApiFarmer,
  ApiFarmerProfile,
  ApiKycDocument,
  Farmer,
  FarmerAction,
  FarmerDetail,
  FarmerDocument,
  FarmerFormValue,
  FarmerStats,
  KENYA_COUNTIES,
  toDocument,
  toFarm,
  toFarmer,
  toProfile,
} from '../models/farmer.model';

const API = 'https://either-juvenile-progeny.ngrok-free.dev/api/v1';

export function apiError(e: unknown): string {
  const err = e as HttpErrorResponse;

  return (
    err?.error?.error?.details ||
    err?.error?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

/**
 * Common headers for requests to the Kilivana backend.
 *
 * NOTE:
 * Authorization is added dynamically from localStorage.
 * Do not hard-code the JWT here.
 */
function apiHeaders(): HttpHeaders {
  const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    '';

  let headers = new HttpHeaders({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  });

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

/** The list endpoint can return several possible shapes. */
function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  const o = data as Record<string, unknown> | null;

  if (!o || typeof o !== 'object') {
    return [];
  }

  for (const k of ['content', 'items', 'farmers', 'results', 'data']) {
    if (Array.isArray(o[k])) {
      return o[k] as T[];
    }
  }

  return (Object.values(o).find(Array.isArray) as T[] | undefined) ?? [];
}

@Injectable({
  providedIn: 'root',
})
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

  /**
   * GET /admin/farmers
   */
  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.http
      .get<ApiEnvelope<unknown>>(`${API}/admin/farmers`, {
        params: {
          page: 0,
          size: 500,
        },
        headers: apiHeaders(),
      })
      .subscribe({
        next: (r) => {
          const list = unwrapList<ApiFarmer>(r.data)
            .map(toFarmer)
            .sort((a, b) => (b.joinedAt ?? '').localeCompare(a.joinedAt ?? ''));

          this._farmers.set(list);
          this.loading.set(false);
        },

        error: (e) => {
          this.loadError.set(apiError(e));
          this.loading.set(false);
        },
      });
  }

  /**
   * GET /admin/farmers/{id}
   */
  private fetchFarmer(id: string | number): Observable<ApiFarmer> {
    return this.http
      .get<ApiEnvelope<ApiFarmer>>(`${API}/admin/farmers/${id}`, {
        headers: apiHeaders(),
      })
      .pipe(map((r) => r.data));
  }

  /**
   * GET farmer details
   */
  getDetail(id: string): Observable<FarmerDetail> {
    return forkJoin({
      farmer: this.fetchFarmer(id),

      profile: this.http
        .get<ApiEnvelope<ApiFarmerProfile>>(`${API}/profiles/farmers/${id}`, {
          headers: apiHeaders(),
        })
        .pipe(
          map((r) => (r.data ? toProfile(r.data) : null)),
          catchError(() => of(null)),
        ),

      docs: this.http
        .get<ApiEnvelope<ApiKycDocument[]>>(`${API}/admin/kyc`, {
          headers: apiHeaders(),
        })
        .pipe(
          map((r) => (r.data ?? []).filter((d) => String(d.userId) === String(id)).map(toDocument)),
          catchError(() => of([] as FarmerDocument[])),
        ),
    }).pipe(
      map(({ farmer, profile, docs }) => ({
        ...toFarmer(farmer),
        farms: (farmer.farms ?? []).map(toFarm),
        profile,
        documents: docs,
      })),
    );
  }

  /**
   * GET /regions
   */
  regions(): Observable<string[]> {
    return this.http
      .get<ApiEnvelope<string[]>>(`${API}/regions`, {
        headers: apiHeaders(),
      })
      .pipe(
        map((r) => (Array.isArray(r.data) ? r.data.filter(Boolean) : [])),
        map((list) => (list.length ? list : KENYA_COUNTIES)),
        catchError(() => of(KENYA_COUNTIES)),
      );
  }

  /**
   * POST /admin/users
   */
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

    return this.http
      .post<ApiEnvelope<{ id: number }>>(`${API}/admin/users`, body, {
        headers: apiHeaders(),
      })
      .pipe(
        switchMap((r) =>
          this.http
            .post(`${API}/profiles/farmers/${r.data.id}`, this.profileBody(v), {
              headers: apiHeaders(),
            })
            .pipe(switchMap(() => this.fetchFarmer(r.data.id))),
        ),
        map(toFarmer),
        tap((f) => this._farmers.update((l) => [f, ...l])),
      );
  }

  /**
   * PUT /admin/users/{id}
   */
  update(id: string, v: FarmerFormValue): Observable<Farmer> {
    const body = {
      name: v.name,
      email: v.email,
      phone: v.phone,
      region: v.region,
      role: 'FARMER',
    };

    return this.http
      .put(`${API}/admin/users/${id}`, body, {
        headers: apiHeaders(),
      })
      .pipe(
        switchMap(() =>
          this.http
            .put(`${API}/profiles/farmers/${id}`, this.profileBody(v), {
              headers: apiHeaders(),
            })
            .pipe(
              catchError((e: HttpErrorResponse) =>
                e.status === 404
                  ? this.http.post(`${API}/profiles/farmers/${id}`, this.profileBody(v), {
                      headers: apiHeaders(),
                    })
                  : throwError(() => e),
              ),
            ),
        ),

        switchMap(() => this.fetchFarmer(id)),

        map(toFarmer),

        tap((f) => this.patchLocal(f)),
      );
  }

  /**
   * Approve / reject / suspend / reinstate
   */
  applyAction(id: string, action: FarmerAction, reason = ''): Observable<Farmer> {
    const params = {
      reason,
    };

    let call: Observable<unknown>;

    switch (action) {
      case 'approve':
        call = this.http.post(`${API}/admin/farmers/${id}/approve`, null, {
          headers: apiHeaders(),
        });
        break;

      case 'reject':
        call = this.http.post(`${API}/admin/farmers/${id}/reject`, null, {
          headers: apiHeaders(),
          params,
        });
        break;

      case 'suspend':
        call = this.http.put(`${API}/admin/farmers/${id}/suspend`, null, {
          headers: apiHeaders(),
          params,
        });
        break;

      case 'reinstate':
        call = this.http.put(`${API}/admin/farmers/${id}/unsuspend`, null, {
          headers: apiHeaders(),
        });
        break;
    }

    return call.pipe(
      switchMap(() => this.fetchFarmer(id)),

      map(toFarmer),

      tap((f) => this.patchLocal(f)),
    );
  }

  private profileBody(v: FarmerFormValue) {
    return {
      farmName: v.farmName,
      location: v.location,
      farmDetails: v.farmDetails,
    };
  }

  private patchLocal(f: Farmer) {
    this._farmers.update((l) => l.map((x) => (x.id === f.id ? f : x)));
  }
}
