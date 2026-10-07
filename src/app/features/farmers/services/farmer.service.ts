import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { Injectable, computed, inject, signal } from '@angular/core';

import { Observable, catchError, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';

import {
  ApiEnvelope,
  ApiFarmer,
  ApiFarmerImage,
  ApiFarmerProfile,
  ApiKycDocument,
  Farmer,
  FarmerAction,
  FarmerDetail,
  FarmerDocument,
  FarmerFormValue,
  FarmerProfileImage,
  FarmerStats,
  KENYA_COUNTIES,
  toDocument,
  toFarm,
  toFarmer,
  toProfile,
  toProfileImage,
} from '../models/farmer.model';

const API = 'https://either-juvenile-progeny.ngrok-free.dev/api/v1';

/* =========================================================
   ERROR HANDLING
   ========================================================= */

export function apiError(e: unknown): string {
  const err = e as HttpErrorResponse;

  return (
    err?.error?.error?.details ||
    err?.error?.message ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}

/* =========================================================
   API HEADERS
   ========================================================= */

/**
 * Common headers for Kilivana API requests.
 *
 * JWT is read dynamically from localStorage.
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

/* =========================================================
   RESPONSE HELPERS
   ========================================================= */

/**
 * The backend may return lists in different structures:
 *
 * []
 *
 * {
 *   content: []
 * }
 *
 * {
 *   items: []
 * }
 *
 * {
 *   data: []
 * }
 */
function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  const object = data as Record<string, unknown> | null;

  if (!object || typeof object !== 'object') {
    return [];
  }

  for (const key of ['content', 'items', 'farmers', 'results', 'data']) {
    if (Array.isArray(object[key])) {
      return object[key] as T[];
    }
  }

  return (Object.values(object).find(Array.isArray) as T[] | undefined) ?? [];
}

/* =========================================================
   FARMER SERVICE
   ========================================================= */

@Injectable({
  providedIn: 'root',
})
export class FarmerService {
  private readonly http = inject(HttpClient);

  /* =======================================================
     LOCAL STATE
     ======================================================= */

  private readonly _farmers = signal<Farmer[]>([]);

  readonly farmers = this._farmers.asReadonly();

  readonly loading = signal(false);

  readonly loadError = signal<string | null>(null);

  /* =======================================================
     FARMER STATS
     ======================================================= */

  readonly stats = computed<FarmerStats>(() => {
    const list = this._farmers();

    const count = (status: Farmer['status']) =>
      list.filter((farmer) => farmer.status === status).length;

    return {
      total: list.length,

      verified: count('verified'),

      pending: count('pending'),

      suspended: count('suspended'),
    };
  });

  /* =======================================================
     LOAD FARMERS
     ======================================================= */

  /**
   * GET /api/v1/admin/farmers
   *
   * Loads all farmers for the admin farmer list.
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
      .pipe(
        map((response) => {
          const list = unwrapList<ApiFarmer>(response.data);

          return list
            .map(toFarmer)
            .sort((a, b) => (b.joinedAt ?? '').localeCompare(a.joinedAt ?? ''));
        }),
      )
      .subscribe({
        next: (farmers) => {
          this._farmers.set(farmers);

          this.loading.set(false);
        },

        error: (error) => {
          this.loadError.set(apiError(error));

          this.loading.set(false);
        },
      });
  }

  /* =======================================================
     FETCH ONE FARMER
     ======================================================= */

  /**
   * GET /api/v1/admin/farmers/{id}
   */
  private fetchFarmer(id: string | number): Observable<ApiFarmer> {
    return this.http
      .get<ApiEnvelope<ApiFarmer>>(`${API}/admin/farmers/${id}`, {
        headers: apiHeaders(),
      })
      .pipe(map((response) => response.data));
  }

  /* =======================================================
     GET FARMER PROFILE
     ======================================================= */

  /**
   * GET /api/v1/profiles/farmers/{userId}
   *
   * This only retrieves the farmer profile.
   *
   * Profile images are retrieved separately through:
   * GET /profiles/farmers/{userId}/images
   */
  getProfile(userId: string | number): Observable<ReturnType<typeof toProfile> | null> {
    return this.http
      .get<ApiEnvelope<ApiFarmerProfile>>(`${API}/profiles/farmers/${userId}`, {
        headers: apiHeaders(),
      })
      .pipe(
        map((response) => (response.data ? toProfile(response.data) : null)),

        catchError(() => of(null)),
      );
  }

  /* =======================================================
     GET FARMER PROFILE IMAGES
     ======================================================= */

  /**
   * GET /api/v1/profiles/farmers/{userId}/images
   *
   * These are images uploaded through the farmer profile.
   *
   * IMPORTANT:
   * These are NOT KYC documents.
   */
  getProfileImages(userId: string | number): Observable<FarmerProfileImage[]> {
    return this.http
      .get<ApiEnvelope<unknown>>(`${API}/profiles/farmers/${userId}/images`, {
        headers: apiHeaders(),
      })
      .pipe(
        map((response) => {
          const images = unwrapList<ApiFarmerImage>(response.data);

          return images.map(toProfileImage).sort((a, b) => a.sortOrder - b.sortOrder);
        }),

        catchError(() => of([] as FarmerProfileImage[])),
      );
  }

  /* =======================================================
     GET FARMER KYC DOCUMENTS
     ======================================================= */

  /**
   * GET /api/v1/admin/kyc
   *
   * The admin KYC endpoint returns KYC documents.
   *
   * We filter them by userId to get documents
   * belonging to this particular farmer.
   */
  getKycDocuments(userId: string | number): Observable<FarmerDocument[]> {
    return this.http
      .get<ApiEnvelope<unknown>>(`${API}/admin/kyc`, {
        headers: apiHeaders(),
      })
      .pipe(
        map((response) => {
          const documents = unwrapList<ApiKycDocument>(response.data);

          return documents
            .filter((document) => String(document.userId) === String(userId))
            .map(toDocument);
        }),

        catchError(() => of([] as FarmerDocument[])),
      );
  }

  /* =======================================================
     GET FARMER DETAILS
     ======================================================= */

  /**
   * Gets all information needed by the farmer details page.
   *
   * Requests:
   *
   * 1. GET /admin/farmers/{id}
   * 2. GET /profiles/farmers/{id}
   * 3. GET /profiles/farmers/{id}/images
   * 4. GET /admin/kyc
   *
   * KYC documents and profile images remain completely
   * separate.
   */
  getDetail(id: string): Observable<FarmerDetail> {
    return forkJoin({
      /* -----------------------------------------------
         Farmer
         ----------------------------------------------- */

      farmer: this.fetchFarmer(id),

      /* -----------------------------------------------
         Farmer profile
         ----------------------------------------------- */

      profile: this.getProfile(id),

      /* -----------------------------------------------
         Profile images
         ----------------------------------------------- */

      profileImages: this.getProfileImages(id),

      /* -----------------------------------------------
         KYC documents
         ----------------------------------------------- */

      documents: this.getKycDocuments(id),
    }).pipe(
      map(({ farmer, profile, profileImages, documents }) => {
        const base = toFarmer(farmer);

        return {
          ...base,

          /* Farmer farms */

          farms: (farmer.farms ?? []).map(toFarm),

          /* Farmer profile */

          profile,

          /* KYC documents */

          documents,

          /* Profile images */

          profileImages,
        };
      }),
    );
  }

  /* =======================================================
     GET COUNTIES / REGIONS
     ======================================================= */

  /**
   * GET /api/v1/regions
   *
   * Returns the Kenyan counties.
   */
  regions(): Observable<string[]> {
    return this.http
      .get<ApiEnvelope<string[]>>(`${API}/regions`, {
        headers: apiHeaders(),
      })
      .pipe(
        map((response) => (Array.isArray(response.data) ? response.data.filter(Boolean) : [])),

        map((list) => (list.length ? list : KENYA_COUNTIES)),

        catchError(() => of(KENYA_COUNTIES)),
      );
  }

  /* =======================================================
     CREATE FARMER
     ======================================================= */

  /**
   * POST /api/v1/admin/users
   *
   * Then:
   *
   * POST /api/v1/profiles/farmers/{userId}
   */
  create(value: FarmerFormValue): Observable<Farmer> {
    const userBody = {
      name: value.name,

      email: value.email,

      phone: value.phone,

      username: value.username,

      password: value.password,

      region: value.region,

      role: 'FARMER',
    };

    return this.http
      .post<
        ApiEnvelope<{
          id: number;
        }>
      >(`${API}/admin/users`, userBody, {
        headers: apiHeaders(),
      })
      .pipe(
        switchMap((response) => {
          const userId = response.data.id;

          return this.http
            .post(`${API}/profiles/farmers/${userId}`, this.profileBody(value), {
              headers: apiHeaders(),
            })
            .pipe(switchMap(() => this.fetchFarmer(userId)));
        }),

        map(toFarmer),

        tap((farmer) => {
          this._farmers.update((list) => [farmer, ...list]);
        }),
      );
  }

  /* =======================================================
     UPDATE FARMER
     ======================================================= */

  /**
   * PUT /api/v1/admin/users/{id}
   *
   * Then:
   *
   * PUT /api/v1/profiles/farmers/{userId}
   *
   * If the farmer profile doesn't exist, we attempt
   * POST /api/v1/profiles/farmers/{userId}.
   */
  update(id: string, value: FarmerFormValue): Observable<Farmer> {
    const userBody = {
      name: value.name,

      email: value.email,

      phone: value.phone,

      region: value.region,

      role: 'FARMER',
    };

    return this.http
      .put(`${API}/admin/users/${id}`, userBody, {
        headers: apiHeaders(),
      })
      .pipe(
        switchMap(() =>
          this.http
            .put(`${API}/profiles/farmers/${id}`, this.profileBody(value), {
              headers: apiHeaders(),
            })
            .pipe(
              catchError((error: HttpErrorResponse) => {
                if (error.status === 404) {
                  return this.http.post(`${API}/profiles/farmers/${id}`, this.profileBody(value), {
                    headers: apiHeaders(),
                  });
                }

                return throwError(() => error);
              }),
            ),
        ),

        switchMap(() => this.fetchFarmer(id)),

        map(toFarmer),

        tap((farmer) => {
          this.patchLocal(farmer);
        }),
      );
  }

  /* =======================================================
     APPROVE / REJECT / SUSPEND / REINSTATE
     ======================================================= */

  /**
   * Farmer administration actions.
   *
   * Approve:
   * POST /admin/farmers/{id}/approve
   *
   * Reject:
   * POST /admin/farmers/{id}/reject
   *
   * Suspend:
   * PUT /admin/farmers/{userId}/suspend
   *
   * Reinstate:
   * PUT /admin/farmers/{userId}/unsuspend
   */
  applyAction(id: string, action: FarmerAction, reason = ''): Observable<Farmer> {
    const params = {
      reason,
    };

    let request: Observable<unknown>;

    switch (action) {
      /* -----------------------------------------------
         APPROVE
         ----------------------------------------------- */

      case 'approve':
        request = this.http.post(`${API}/admin/farmers/${id}/approve`, null, {
          headers: apiHeaders(),
        });

        break;

      /* -----------------------------------------------
         REJECT
         ----------------------------------------------- */

      case 'reject':
        request = this.http.post(`${API}/admin/farmers/${id}/reject`, null, {
          headers: apiHeaders(),

          params,
        });

        break;

      /* -----------------------------------------------
         SUSPEND
         ----------------------------------------------- */

      case 'suspend':
        request = this.http.put(`${API}/admin/farmers/${id}/suspend`, null, {
          headers: apiHeaders(),

          params,
        });

        break;

      /* -----------------------------------------------
         REINSTATE
         ----------------------------------------------- */

      case 'reinstate':
        request = this.http.put(`${API}/admin/farmers/${id}/unsuspend`, null, {
          headers: apiHeaders(),
        });

        break;
    }

    return request.pipe(
      switchMap(() => this.fetchFarmer(id)),

      map(toFarmer),

      tap((farmer) => {
        this.patchLocal(farmer);
      }),
    );
  }

  /* =======================================================
     PROFILE BODY
     ======================================================= */

  private profileBody(value: FarmerFormValue) {
    return {
      farmName: value.farmName,

      location: value.location,

      farmDetails: value.farmDetails,
    };
  }

  /* =======================================================
     UPDATE LOCAL FARMER
     ======================================================= */

  private patchLocal(farmer: Farmer): void {
    this._farmers.update((list) => list.map((item) => (item.id === farmer.id ? farmer : item)));
  }
}
