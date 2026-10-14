import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import {
  ApiCrop,
  ApiCropSummary,
  ApiCropType,
  ApiEnvelope,
  ApiFarm,
  Crop,
  Farm,
  FarmEditValue,
  KENYA_COUNTIES,
  toCrop,
  toFarm,
} from '../models/farm.model';

/** Change this to your environment base URL if you don't use a proxy. */
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

/** The list endpoints are typed as free-form maps in the OpenAPI file, so accept the usual shapes. */
function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  const o = data as Record<string, unknown> | null;
  if (!o || typeof o !== 'object') return [];
  for (const k of ['content', 'items', 'farms', 'crops', 'results', 'data']) {
    if (Array.isArray(o[k])) return o[k] as T[];
  }
  return (Object.values(o).find(Array.isArray) as T[] | undefined) ?? [];
}

@Injectable({ providedIn: 'root' })
export class FarmService {
  private readonly http = inject(HttpClient);

  readonly farms = signal<Farm[]>([]);
  readonly farmsLoading = signal(false);
  readonly farmsError = signal<string | null>(null);

  readonly crops = signal<Crop[]>([]);
  readonly cropsLoading = signal(false);
  readonly cropsError = signal<string | null>(null);

  readonly summary = signal<ApiCropSummary[]>([]);
  readonly cropTypes = signal<ApiCropType[]>([]);

  /** GET /admin/farms */
  loadFarms(): void {
    this.farmsLoading.set(true);
    this.farmsError.set(null);
    this.http
      .get<ApiEnvelope<unknown>>(`${API}/admin/farms`, { params: { page: 0, size: 500 } })
      .subscribe({
        next: (r) => {
          const raw = unwrapList<ApiFarm>(r.data);
          if (!raw.length && r.data && Object.keys(r.data as object).length) {
            console.warn('[FarmService] Unexpected /admin/farms response shape:', r.data);
          }
          this.farms.set(
            raw.map(toFarm).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
          );
          this.farmsLoading.set(false);
        },
        error: (e) => {
          this.farmsError.set(apiError(e));
          this.farmsLoading.set(false);
        },
      });
  }

  /** GET /admin/crops, plus the summary and crop types for the chart and filter */
  loadCrops(): void {
    this.cropsLoading.set(true);
    this.cropsError.set(null);
    this.http
      .get<ApiEnvelope<unknown>>(`${API}/admin/crops`, { params: { page: 0, size: 500 } })
      .subscribe({
        next: (r) => {
          const raw = unwrapList<ApiCrop>(r.data);
          if (!raw.length && r.data && Object.keys(r.data as object).length) {
            console.warn('[FarmService] Unexpected /admin/crops response shape:', r.data);
          }
          this.crops.set(raw.map(toCrop));
          this.cropsLoading.set(false);
        },
        error: (e) => {
          this.cropsError.set(apiError(e));
          this.cropsLoading.set(false);
        },
      });
    this.http
      .get<ApiEnvelope<ApiCropSummary[]>>(`${API}/admin/crops/summary`)
      .pipe(catchError(() => of(null)))
      .subscribe((r) => this.summary.set(r?.data ?? []));
    this.http
      .get<ApiEnvelope<ApiCropType[]>>(`${API}/admin/crops/types`)
      .pipe(catchError(() => of(null)))
      .subscribe((r) => this.cropTypes.set(r?.data ?? []));
  }

  /** GET /admin/farms/{id} */
  getFarm(id: string): Observable<Farm> {
    return this.http
      .get<ApiEnvelope<ApiFarm>>(`${API}/admin/farms/${id}`)
      .pipe(map((r) => toFarm(r.data)));
  }

  /** GET /regions, falling back to the built-in county list */
  regions(): Observable<string[]> {
    return this.http.get<ApiEnvelope<string[]>>(`${API}/regions`).pipe(
      map((r) => (Array.isArray(r.data) ? r.data.filter(Boolean) : [])),
      map((list) => (list.length ? list : KENYA_COUNTIES)),
      catchError(() => of(KENYA_COUNTIES)),
    );
  }

  /** PUT /admin/farms/{id}: the API takes a full farm body, so merge the edits into the current one. */
  updateFarm(id: number, v: FarmEditValue): Observable<Farm> {
    return this.http.get<ApiEnvelope<ApiFarm>>(`${API}/admin/farms/${id}`).pipe(
      switchMap((r) => {
        const body = { ...r.data, ...v } as Partial<ApiFarm>;
        delete body.crops;
        delete body.images;
        return this.http.put<ApiEnvelope<ApiFarm>>(`${API}/admin/farms/${id}`, body);
      }),
      map((r) => toFarm(r.data)),
      tap((f) => this.patchFarm(f)),
    );
  }

  /** PUT /admin/farms/{id}/status?status= */
  setFarmStatus(id: number, status: string): Observable<Farm> {
    return this.http
      .put<ApiEnvelope<ApiFarm>>(`${API}/admin/farms/${id}/status`, null, { params: { status } })
      .pipe(
        map((r) => toFarm(r.data)),
        tap((f) => this.patchFarm(f)),
      );
  }

  /** DELETE /admin/farms/{id} */
  deleteFarm(id: number): Observable<unknown> {
    return this.http
      .delete(`${API}/admin/farms/${id}`)
      .pipe(tap(() => this.farms.update((l) => l.filter((f) => f.id !== id))));
  }

  /** PUT /admin/crops/{id}/status?status= */
  setCropStatus(id: number, status: string): Observable<Crop> {
    return this.http
      .put<ApiEnvelope<ApiCrop>>(`${API}/admin/crops/${id}/status`, null, { params: { status } })
      .pipe(
        map((r) => toCrop(r.data)),
        tap((c) =>
          this.crops.update((l) => l.map((x) => (x.id === id ? { ...x, status: c.status } : x))),
        ),
      );
  }

  /** DELETE /admin/crops/{id} */
  deleteCrop(id: number): Observable<unknown> {
    return this.http
      .delete(`${API}/admin/crops/${id}`)
      .pipe(tap(() => this.crops.update((l) => l.filter((c) => c.id !== id))));
  }

  private patchFarm(f: Farm) {
    this.farms.update((l) => l.map((x) => (x.id === f.id ? f : x)));
  }
}
