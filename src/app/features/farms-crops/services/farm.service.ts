import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';

import {
  InspectionRequest,
  InspectionResponse,
  InspectionEvidenceImage,
} from '../models/inspection.model';

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

import { API_BASE } from '../../../core/config/api.config';

/** Ngrok browser-warning bypass header */
const NGROK_HEADERS = new HttpHeaders({
  'ngrok-skip-browser-warning': 'true',
});

/** Standard HTTP options for API requests */
const HTTP_OPTIONS = {
  headers: NGROK_HEADERS,
};

/** Extract a useful API error message */
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
 * List endpoints may return arrays directly or inside common
 * pagination/envelope properties.
 */
function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  const o = data as Record<string, unknown> | null;

  if (!o || typeof o !== 'object') {
    return [];
  }

  for (const key of ['content', 'items', 'farms', 'crops', 'results', 'data']) {
    if (Array.isArray(o[key])) {
      return o[key] as T[];
    }
  }

  return (Object.values(o).find(Array.isArray) as T[] | undefined) ?? [];
}

@Injectable({
  providedIn: 'root',
})
export class FarmService {
  private readonly http = inject(HttpClient);

  /** Farms state */
  readonly farms = signal<Farm[]>([]);
  readonly farmsLoading = signal(false);
  readonly farmsError = signal<string | null>(null);

  /** Crops state */
  readonly crops = signal<Crop[]>([]);
  readonly cropsLoading = signal(false);
  readonly cropsError = signal<string | null>(null);

  /** Crop summaries and types */
  readonly summary = signal<ApiCropSummary[]>([]);
  readonly cropTypes = signal<ApiCropType[]>([]);

  /** Inspection API base URL */
  private readonly inspectionUrl = `${API_BASE}/admin/inspections`;

  // ============================================================
  // FARMS
  // ============================================================

  /** GET /admin/farms */
  loadFarms(): void {
    this.farmsLoading.set(true);
    this.farmsError.set(null);

    this.http
      .get<ApiEnvelope<unknown>>(`${API_BASE}/admin/farms`, {
        ...HTTP_OPTIONS,
        params: {
          page: 0,
          size: 500,
        },
      })
      .subscribe({
        next: (response) => {
          const raw = unwrapList<ApiFarm>(response.data);

          if (
            !raw.length &&
            response.data &&
            typeof response.data === 'object' &&
            Object.keys(response.data).length
          ) {
            console.warn('[FarmService] Unexpected /admin/farms response shape:', response.data);
          }

          this.farms.set(
            raw.map(toFarm).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
          );

          this.farmsLoading.set(false);
        },
        error: (error) => {
          this.farmsError.set(apiError(error));
          this.farmsLoading.set(false);
        },
      });
  }

  /** GET /admin/farms/{id} */
  getFarm(id: string): Observable<Farm> {
    return this.http
      .get<ApiEnvelope<ApiFarm>>(`${API_BASE}/admin/farms/${id}`, HTTP_OPTIONS)
      .pipe(map((response) => toFarm(response.data)));
  }

  /**
   * GET /regions
   * Falls back to the built-in Kenyan counties if the API fails
   * or returns an empty list.
   */
  regions(): Observable<string[]> {
    return this.http.get<ApiEnvelope<string[]>>(`${API_BASE}/regions`, HTTP_OPTIONS).pipe(
      map((response) => (Array.isArray(response.data) ? response.data.filter(Boolean) : [])),
      map((regions) => (regions.length ? regions : KENYA_COUNTIES)),
      catchError(() => of(KENYA_COUNTIES)),
    );
  }

  /**
   * PUT /admin/farms/{id}
   * Fetches the existing farm, merges editable fields, and removes
   * fields that must not be included in the update body.
   */
  updateFarm(id: number, value: FarmEditValue): Observable<Farm> {
    return this.http.get<ApiEnvelope<ApiFarm>>(`${API_BASE}/admin/farms/${id}`, HTTP_OPTIONS).pipe(
      switchMap((response) => {
        const body = {
          ...response.data,
          ...value,
        } as Partial<ApiFarm>;

        delete body.crops;
        delete body.images;

        return this.http.put<ApiEnvelope<ApiFarm>>(
          `${API_BASE}/admin/farms/${id}`,
          body,
          HTTP_OPTIONS,
        );
      }),
      map((response) => toFarm(response.data)),
      tap((farm) => this.patchFarm(farm)),
    );
  }

  /** PUT /admin/farms/{id}/status?status= */
  setFarmStatus(id: number, status: string): Observable<Farm> {
    return this.http
      .put<ApiEnvelope<ApiFarm>>(`${API_BASE}/admin/farms/${id}/status`, null, {
        ...HTTP_OPTIONS,
        params: { status },
      })
      .pipe(
        map((response) => toFarm(response.data)),
        tap((farm) => this.patchFarm(farm)),
      );
  }

  /** DELETE /admin/farms/{id} */
  deleteFarm(id: number): Observable<unknown> {
    return this.http.delete(`${API_BASE}/admin/farms/${id}`, HTTP_OPTIONS).pipe(
      tap(() => {
        this.farms.update((list) => list.filter((farm) => farm.id !== id));
      }),
    );
  }

  private patchFarm(farm: Farm): void {
    this.farms.update((list) => list.map((item) => (item.id === farm.id ? farm : item)));
  }

  // ============================================================
  // CROPS
  // ============================================================

  /** GET /admin/crops, summary, and crop types */
  loadCrops(): void {
    this.cropsLoading.set(true);
    this.cropsError.set(null);

    this.http
      .get<ApiEnvelope<unknown>>(`${API_BASE}/admin/crops`, {
        ...HTTP_OPTIONS,
        params: {
          page: 0,
          size: 500,
        },
      })
      .subscribe({
        next: (response) => {
          const raw = unwrapList<ApiCrop>(response.data);

          if (
            !raw.length &&
            response.data &&
            typeof response.data === 'object' &&
            Object.keys(response.data).length
          ) {
            console.warn('[FarmService] Unexpected /admin/crops response shape:', response.data);
          }

          this.crops.set(raw.map(toCrop));
          this.cropsLoading.set(false);
        },
        error: (error) => {
          this.cropsError.set(apiError(error));
          this.cropsLoading.set(false);
        },
      });

    this.http
      .get<ApiEnvelope<ApiCropSummary[]>>(`${API_BASE}/admin/crops/summary`, HTTP_OPTIONS)
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        this.summary.set(response?.data ?? []);
      });

    this.http
      .get<ApiEnvelope<ApiCropType[]>>(`${API_BASE}/admin/crops/types`, HTTP_OPTIONS)
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        this.cropTypes.set(response?.data ?? []);
      });
  }

  /** PUT /admin/crops/{id}/status?status= */
  setCropStatus(id: number, status: string): Observable<Crop> {
    return this.http
      .put<ApiEnvelope<ApiCrop>>(`${API_BASE}/admin/crops/${id}/status`, null, {
        ...HTTP_OPTIONS,
        params: { status },
      })
      .pipe(
        map((response) => toCrop(response.data)),
        tap((crop) => {
          this.crops.update((list) =>
            list.map((item) => (item.id === id ? { ...item, status: crop.status } : item)),
          );
        }),
      );
  }

  /** DELETE /admin/crops/{id} */
  deleteCrop(id: number): Observable<unknown> {
    return this.http.delete(`${API_BASE}/admin/crops/${id}`, HTTP_OPTIONS).pipe(
      tap(() => {
        this.crops.update((list) => list.filter((crop) => crop.id !== id));
      }),
    );
  }

  // ============================================================
  // INSPECTIONS
  // ============================================================

  /**
   * GET /admin/inspections/target/{targetType}/{targetId}
   *
   * Returns a LIST of inspections, not a single inspection.
   *
   * Example targetType values must match the backend API,
   * such as FARM or FARMER. The correct value depends on the
   * resource being inspected and the backend implementation.
   */
  /**
   * GET an inspection evidence image.
   *
   * Resolves relative image URLs against the backend API host
   * instead of the Angular frontend at localhost:4200.
   */
  getInspectionImageBlob(url: string): Observable<Blob> {
    const apiUrl = new URL(API_BASE);
    const imageUrl = new URL(url, apiUrl.origin);

    return this.http.get(imageUrl.href, {
      headers: NGROK_HEADERS,
      responseType: 'blob',
    });
  }

  getInspectionsByTarget(targetType: string, targetId: number): Observable<InspectionResponse[]> {
    return this.http
      .get<
        ApiEnvelope<InspectionResponse[]>
      >(`${this.inspectionUrl}/target/${encodeURIComponent(targetType)}/${targetId}`, HTTP_OPTIONS)
      .pipe(map((response) => (Array.isArray(response.data) ? response.data : [])));
  }

  /**
   * Compatibility method for existing callers that request
   * inspections for a farm using the FARM target type.
   *
   * IMPORTANT: Update callers to handle an array.
   * If your backend uses FARMER for this resource, call
   * getInspectionsByTarget('FARMER', targetId) instead.
   */
  getFarmInspection(farmId: number): Observable<InspectionResponse[]> {
    return this.getInspectionsByTarget('FARM', farmId);
  }

  /**
   * POST /admin/inspections
   * Creates an inspection and assigns an inspector.
   */
  assignInspector(request: InspectionRequest): Observable<InspectionResponse> {
    return this.http
      .post<ApiEnvelope<InspectionResponse>>(this.inspectionUrl, request, HTTP_OPTIONS)
      .pipe(map((response) => response.data));
  }

  /**
   * PUT /admin/inspections/{id}/status
   */
  updateInspectionStatus(inspectionId: number, status: string): Observable<InspectionResponse> {
    return this.http
      .put<
        ApiEnvelope<InspectionResponse>
      >(`${this.inspectionUrl}/${inspectionId}/status`, { status }, HTTP_OPTIONS)
      .pipe(map((response) => response.data));
  }

  /**
   * POST /admin/inspections/{id}/result
   */
  submitInspectionResult(
    inspectionId: number,
    result: string,
    notes: string,
  ): Observable<InspectionResponse> {
    return this.http
      .post<
        ApiEnvelope<InspectionResponse>
      >(`${this.inspectionUrl}/${inspectionId}/result`, { result, notes }, HTTP_OPTIONS)
      .pipe(map((response) => response.data));
  }

  /**
   * POST /admin/inspections/{id}/evidence/images
   * Uploads one actual image file.
   */
  uploadInspectionEvidence(inspectionId: number, file: File): Observable<unknown> {
    const formData = new FormData();
    formData.append('image', file);

    // Do not set Content-Type manually for FormData.
    // The browser must set the multipart boundary.
    return this.http.post(
      `${this.inspectionUrl}/${inspectionId}/evidence/images`,
      formData,
      HTTP_OPTIONS,
    );
  }

  /**
   * GET /admin/inspections/{id}/evidence/images
   *
   * The API returns:
   * {
   *   success: true,
   *   data: [{ id, url, publicId, assetId, ... }]
   * }
   */
  getInspectionEvidence(inspectionId: number): Observable<InspectionEvidenceImage[]> {
    return this.http
      .get<
        ApiEnvelope<InspectionEvidenceImage[]>
      >(`${this.inspectionUrl}/${inspectionId}/evidence/images`, HTTP_OPTIONS)
      .pipe(map((response) => (Array.isArray(response.data) ? response.data : [])));
  }

  /**
   * DELETE /admin/inspections/{id}/evidence/images/{imageId}
   */
  deleteInspectionEvidence(inspectionId: number, imageId: number): Observable<unknown> {
    return this.http.delete(
      `${this.inspectionUrl}/${inspectionId}/evidence/images/${imageId}`,
      HTTP_OPTIONS,
    );
  }

  /**
   * DELETE /admin/inspections/{id}
   */
  deleteInspection(inspectionId: number): Observable<unknown> {
    return this.http.delete(`${this.inspectionUrl}/${inspectionId}`, HTTP_OPTIONS);
  }
}
