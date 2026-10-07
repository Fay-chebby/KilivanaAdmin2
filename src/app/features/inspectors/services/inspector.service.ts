import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import {
  ApiResponse,
  FarmAssignment,
  FarmPhoto,
  Inspector,
  InspectorCreatePayload,
  InspectorImage,
  InspectorPayload,
  InspectorProfileRequest,
  InspectorProfileResponse,
  InspectionRequest,
  InspectionResponse,
  InspectionStatus,
  UserRegistrationRequest,
  UserResponse,
  InspectorStatus,
} from '../models/inspector.model';

import { catchError, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InspectorService {
  private readonly http = inject(HttpClient);

  private readonly API = 'https://either-juvenile-progeny.ngrok-free.dev/api/v1';

  // Ngrok header only
  private readonly ngrokHeaders = new HttpHeaders({
    'ngrok-skip-browser-warning': 'true',
  });

  private readonly _inspectors = signal<Inspector[]>([]);
  private readonly _assignments = signal<FarmAssignment[]>([]);
  private readonly _loading = signal(false);

  readonly inspectors = this._inspectors.asReadonly();
  readonly assignments = this._assignments.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly stats = computed(() => {
    const inspectors = this._inspectors();
    const assignments = this._assignments();

    return {
      total: inspectors.length,

      active: inspectors.filter((i) => i.status === 'active').length,

      suspended: inspectors.filter((i) => i.status === 'suspended').length,

      pending: assignments.filter(
        (a) =>
          a.status === 'pending' ||
          a.inspectionStatus === 'ASSIGNED' ||
          a.inspectionStatus === 'PENDING',
      ).length,
    };
  });

  // =========================================================
  // INSPECTOR LIST
  // =========================================================

  loadInspectors(): Observable<Inspector[]> {
    this._loading.set(true);

    return this.http
      .get<ApiResponse<UserResponse[]>>(`${this.API}/admin/users/role/INSPECTOR`, {
        headers: this.ngrokHeaders,
      })
      .pipe(
        switchMap((response) => {
          const users = response.data ?? [];

          if (!users.length) {
            return of([]);
          }

          return forkJoin(users.map((user) => this.buildInspector(user)));
        }),

        tap((inspectors) => {
          this._inspectors.set(inspectors);
          this._loading.set(false);
        }),

        catchError((error) => {
          this._loading.set(false);
          return throwError(() => error);
        }),
      );
  }

  private buildInspector(user: UserResponse): Observable<Inspector> {
    return forkJoin({
      profile: this.getProfile(user.id).pipe(catchError(() => of(null))),

      inspections: this.getInspectorInspections(user.id).pipe(catchError(() => of(null))),
    }).pipe(
      map(({ profile, inspections }) => {
        const profileData = profile?.data ?? null;

        const inspectionData = inspections?.data ?? [];

        return this.mapInspector(user, profileData, inspectionData);
      }),
    );
  }

  // =========================================================
  // GET INSPECTOR
  // =========================================================

  getById(id: number): Inspector | undefined {
    return this._inspectors().find((inspector) => inspector.id === id);
  }

  getInspector(id: number): Observable<Inspector> {
    const cached = this.getById(id);

    if (cached) {
      return of(cached);
    }

    return forkJoin({
      user: this.getUser(id),
      profile: this.getProfile(id),
      inspections: this.getInspectorInspections(id),
    }).pipe(
      map(({ user, profile, inspections }) =>
        this.mapInspector(user.data, profile.data, inspections.data ?? []),
      ),

      tap((inspector) => {
        this._inspectors.update((list) => {
          const exists = list.some((item) => item.id === inspector.id);

          return exists
            ? list.map((item) => (item.id === inspector.id ? inspector : item))
            : [...list, inspector];
        });
      }),
    );
  }

  // =========================================================
  // USER
  // =========================================================

  getUser(id: number): Observable<ApiResponse<UserResponse>> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.API}/admin/users/${id}`, {
      headers: this.ngrokHeaders,
    });
  }

  // =========================================================
  // PROFILE
  // =========================================================

  getProfile(userId: number): Observable<ApiResponse<InspectorProfileResponse>> {
    return this.http.get<ApiResponse<InspectorProfileResponse>>(
      `${this.API}/profiles/inspectors/${userId}`,
      {
        headers: this.ngrokHeaders,
      },
    );
  }

  createProfile(
    userId: number,
    payload: InspectorProfileRequest,
  ): Observable<ApiResponse<InspectorProfileResponse>> {
    return this.http.post<ApiResponse<InspectorProfileResponse>>(
      `${this.API}/profiles/inspectors/${userId}`,
      payload,
      {
        headers: this.ngrokHeaders,
      },
    );
  }

  updateProfile(
    userId: number,
    payload: InspectorProfileRequest,
  ): Observable<ApiResponse<InspectorProfileResponse>> {
    return this.http.put<ApiResponse<InspectorProfileResponse>>(
      `${this.API}/profiles/inspectors/${userId}`,
      payload,
      {
        headers: this.ngrokHeaders,
      },
    );
  }

  deleteProfile(userId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/profiles/inspectors/${userId}`, {
      headers: this.ngrokHeaders,
    });
  }

  // =========================================================
  // CREATE
  // =========================================================

  create(payload: InspectorCreatePayload): Observable<Inspector> {
    this._loading.set(true);

    const userPayload: UserRegistrationRequest = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.temporaryPassword,
      role: 'INSPECTOR',
      username: this.generateUsername(payload.name),
      region: payload.region,
    };

    return this.http
      .post<ApiResponse<UserResponse>>(`${this.API}/admin/users`, userPayload, {
        headers: this.ngrokHeaders,
      })
      .pipe(
        switchMap((userResponse) => {
          const user = userResponse.data;

          const profilePayload: InspectorProfileRequest = {
            inspectorDetails: payload.inspectorDetails,

            specialization: payload.specialization,

            assignedArea: payload.assignedArea,

            status: this.toBackendInspectorStatus(payload.status),
          };

          return this.createProfile(user.id, profilePayload).pipe(
            switchMap(() => this.activateUser(user.id)),

            switchMap(() => this.getInspector(user.id)),

            catchError((error) => {
              return this.http
                .delete<ApiResponse<void>>(`${this.API}/admin/users/${user.id}`, {
                  headers: this.ngrokHeaders,
                })
                .pipe(switchMap(() => throwError(() => error)));
            }),
          );
        }),

        tap((inspector) => {
          this._inspectors.update((list) => [
            ...list.filter((item) => item.id !== inspector.id),
            inspector,
          ]);

          this._loading.set(false);
        }),

        catchError((error) => {
          this._loading.set(false);
          return throwError(() => error);
        }),
      );
  }

  // =========================================================
  // UPDATE
  // =========================================================

  update(id: number, payload: InspectorPayload): Observable<Inspector> {
    this._loading.set(true);

    const profilePayload: InspectorProfileRequest = {
      inspectorDetails: payload.inspectorDetails,

      specialization: payload.specialization,

      assignedArea: payload.assignedArea,

      status: this.toBackendInspectorStatus(payload.status),
    };

    return this.updateProfile(id, profilePayload).pipe(
      switchMap(() => this.getInspector(id)),

      tap((inspector) => {
        this._inspectors.update((list) => list.map((item) => (item.id === id ? inspector : item)));

        this._loading.set(false);
      }),

      catchError((error) => {
        this._loading.set(false);
        return throwError(() => error);
      }),
    );
  }

  // =========================================================
  // ACTIVATE
  // =========================================================

  activateUser(id: number): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(
      `${this.API}/admin/users/${id}/activate`,
      {},
      {
        headers: this.ngrokHeaders,
      },
    );
  }

  // =========================================================
  // SUSPEND
  // =========================================================
  suspend(id: number, reason: string): Observable<Inspector> {
    const params = new HttpParams().set('reason', reason);

    return this.http
      .put<ApiResponse<UserResponse>>(
        `${this.API}/admin/inspectors/${id}/suspend`,
        {},
        {
          headers: this.ngrokHeaders,
          params,
        },
      )
      .pipe(
        switchMap(() => this.getInspector(id)),

        tap((inspector) => {
          const updatedInspector: Inspector = {
            ...inspector,
            status: 'suspended',
            suspendReason: reason,
          };

          this._inspectors.update((list) =>
            list.map((item) => (item.id === id ? updatedInspector : item)),
          );
        }),
      );
  }

  // =========================================================
  // UNSUSPEND
  // =========================================================

  reactivate(id: number): Observable<Inspector> {
    return this.http
      .put<ApiResponse<UserResponse>>(
        `${this.API}/admin/inspectors/${id}/unsuspend`,
        {},
        {
          headers: this.ngrokHeaders,
        },
      )
      .pipe(
        switchMap(() => this.getInspector(id)),

        tap((inspector) => {
          const updatedInspector: Inspector = {
            ...inspector,
            status: 'active',
            suspendReason: undefined,
          };

          this._inspectors.update((list) =>
            list.map((item) => (item.id === id ? updatedInspector : item)),
          );
        }),
      );
  }

  // =========================================================
  // DELETE
  // =========================================================

  remove(id: number): Observable<void> {
    return this.deleteProfile(id).pipe(
      switchMap(() =>
        this.http.delete<ApiResponse<void>>(`${this.API}/admin/users/${id}`, {
          headers: this.ngrokHeaders,
        }),
      ),

      tap(() => {
        this._inspectors.update((list) => list.filter((item) => item.id !== id));

        this._assignments.update((list) => list.filter((item) => item.inspectorId !== id));
      }),

      map(() => undefined),
    );
  }

  // =========================================================
  // INSPECTIONS
  // =========================================================

  getInspectorInspections(inspectorId: number): Observable<ApiResponse<InspectionResponse[]>> {
    return this.http.get<ApiResponse<InspectionResponse[]>>(
      `${this.API}/admin/inspections/inspector/${inspectorId}`,
      {
        headers: this.ngrokHeaders,
      },
    );
  }

  assignmentsFor(inspectorId: number): FarmAssignment[] {
    return this._assignments().filter((assignment) => assignment.inspectorId === inspectorId);
  }

  loadAssignments(inspectorId: number): Observable<FarmAssignment[]> {
    return this.getInspectorInspections(inspectorId).pipe(
      map((response) => (response.data ?? []).map((inspection) => this.mapAssignment(inspection))),

      tap((assignments) => {
        this._assignments.update((current) => [
          ...current.filter((item) => item.inspectorId !== inspectorId),
          ...assignments,
        ]);
      }),
    );
  }

  // =========================================================
  // UPDATE INSPECTION STATUS
  // =========================================================

  updateInspectionStatus(
    inspectionId: number,
    status: InspectionStatus,
  ): Observable<InspectionResponse> {
    const params = new HttpParams().set('status', status);

    return this.http
      .put<ApiResponse<InspectionResponse>>(
        `${this.API}/admin/inspections/${inspectionId}/status`,
        {},
        {
          headers: this.ngrokHeaders,
          params,
        },
      )
      .pipe(
        tap((response) => {
          this.updateAssignmentFromInspection(response.data);
        }),

        map((response) => response.data),
      );
  }

  // =========================================================
  // SUBMIT VERIFICATION
  // =========================================================

  submitVerification(
    assignment: FarmAssignment,
    result: string,
    notes: string,
  ): Observable<InspectionResponse> {
    const payload: InspectionRequest = {
      inspectorId: assignment.inspectorId,

      targetType: assignment.targetType,

      targetId: assignment.targetId,

      status:
        assignment.inspectionStatus === 'ASSIGNED'
          ? 'IN_PROGRESS'
          : (assignment.inspectionStatus as InspectionStatus),

      result,

      notes,

      evidenceUrls: assignment.photos.map((photo) => photo.url),
    };

    const params = new HttpParams().set('result', result);

    return this.http
      .post<ApiResponse<InspectionResponse>>(
        `${this.API}/admin/inspections/${assignment.inspectionId}/result`,
        payload,
        {
          headers: this.ngrokHeaders,
          params,
        },
      )
      .pipe(
        tap((response) => {
          this.updateAssignmentFromInspection(response.data);
        }),

        map((response) => response.data),
      );
  }

  // =========================================================
  // EVIDENCE IMAGES
  // =========================================================

  getEvidenceImages(inspectionId: number): Observable<InspectorImage[]> {
    return this.http
      .get<ApiResponse<InspectorImage[]>>(
        `${this.API}/admin/inspections/${inspectionId}/evidence/images`,
        {
          headers: this.ngrokHeaders,
        },
      )
      .pipe(map((response) => response.data ?? []));
  }

  uploadEvidenceImage(inspectionId: number, file: File): Observable<InspectorImage> {
    const formData = new FormData();

    formData.append('image', file);

    return this.http
      .post<ApiResponse<InspectorImage>>(
        `${this.API}/admin/inspections/${inspectionId}/evidence/images`,
        formData,
        {
          headers: this.ngrokHeaders,
        },
      )
      .pipe(map((response) => response.data));
  }

  deleteEvidenceImage(inspectionId: number, imageId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(
        `${this.API}/admin/inspections/${inspectionId}/evidence/images/${imageId}`,
        {
          headers: this.ngrokHeaders,
        },
      )
      .pipe(map(() => undefined));
  }

  // =========================================================
  // INSPECTOR IMAGES
  // =========================================================

  getInspectorImages(userId: number): Observable<InspectorImage[]> {
    return this.http
      .get<ApiResponse<InspectorImage[]>>(`${this.API}/profiles/inspectors/${userId}/images`, {
        headers: this.ngrokHeaders,
      })
      .pipe(map((response) => response.data ?? []));
  }

  setPrimaryImage(userId: number, imageId: number): Observable<InspectorImage> {
    return this.http
      .put<ApiResponse<InspectorImage>>(
        `${this.API}/profiles/inspectors/${userId}/images/${imageId}/primary`,
        {},
        {
          headers: this.ngrokHeaders,
        },
      )
      .pipe(map((response) => response.data));
  }

  deleteInspectorImage(userId: number, imageId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.API}/profiles/inspectors/${userId}/images/${imageId}`, {
        headers: this.ngrokHeaders,
      })
      .pipe(map(() => undefined));
  }

  // =========================================================
  // PENDING / COMPLETED
  // =========================================================

  pendingFor(inspectorId: number): FarmAssignment[] {
    return this.assignmentsFor(inspectorId).filter(
      (assignment) =>
        assignment.status === 'pending' ||
        assignment.inspectionStatus === 'ASSIGNED' ||
        assignment.inspectionStatus === 'PENDING' ||
        assignment.inspectionStatus === 'IN_PROGRESS',
    );
  }

  completedFor(inspector: Inspector): FarmAssignment[] {
    return this.assignmentsFor(inspector.id).filter(
      (assignment) => assignment.inspectionStatus === 'COMPLETED',
    );
  }

  // =========================================================
  // PASSWORD
  // =========================================================

  generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';

    let password = '';

    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  }

  private generateUsername(name: string): string {
    const username = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');

    return username || `inspector.${Date.now()}`;
  }

  // =========================================================
  // MAP INSPECTOR
  // =========================================================

  private mapInspector(
    user: UserResponse,
    profile: InspectorProfileResponse | null,
    inspections: InspectionResponse[],
  ): Inspector {
    const pending = inspections.filter(
      (inspection) =>
        inspection.status === 'ASSIGNED' ||
        inspection.status === 'PENDING' ||
        inspection.status === 'IN_PROGRESS',
    ).length;

    const completed = inspections.filter((inspection) => inspection.status === 'COMPLETED').length;

    const approved = inspections.filter((inspection) => inspection.result === 'APPROVED').length;

    const passRate = completed > 0 ? Math.round((approved / completed) * 100) : 0;

    return {
      id: user.id,

      code: user.referenceCode ?? `I-${String(user.id).padStart(3, '0')}`,

      name: user.name,

      email: user.email,

      phone: user.phone,

      username: user.username ?? undefined,

      specialization: profile?.specialization ?? '',

      region: user.region ?? '',

      assignedArea: profile?.assignedArea ?? '',

      inspectorDetails: profile?.inspectorDetails ?? '',

      status: this.toFrontendStatus(profile?.status ?? user.status),

      suspendReason: undefined,

      pending,

      completed,

      passRate,

      rating: 0,

      createdAt: profile?.createdAt ?? user.createdAt,

      mustChangePassword: false,

      images: profile?.images ?? [],

      verificationStatus: user.verificationStatus,
    };
  }

  // =========================================================
  // MAP ASSIGNMENT
  // =========================================================

  private mapAssignment(inspection: InspectionResponse): FarmAssignment {
    return {
      id: String(inspection.id),

      inspectionId: inspection.id,

      inspectorId: inspection.inspectorId,

      farmerName: `Target #${inspection.targetId}`,

      farmName: `${inspection.targetType} #${inspection.targetId}`,

      location: '',

      crop: '',

      sizeAcres: 0,

      dueDate: inspection.inspectedAt ?? inspection.createdAt,

      status: this.toVerificationStatus(inspection),

      inspectionStatus: inspection.status,

      result: inspection.result,

      notes: inspection.notes ?? '',

      photos: (inspection.evidenceUrls ?? []).map((url, index) => ({
        id: `${inspection.id}-${index}`,

        url,

        caption: '',

        takenAt: inspection.inspectedAt ?? inspection.createdAt,
      })),

      targetType: inspection.targetType,

      targetId: inspection.targetId,
    };
  }

  private updateAssignmentFromInspection(inspection: InspectionResponse): void {
    const assignment = this.mapAssignment(inspection);

    this._assignments.update((list) => {
      const exists = list.some((item) => item.inspectionId === inspection.id);

      if (!exists) {
        return [...list, assignment];
      }

      return list.map((item) =>
        item.inspectionId === inspection.id
          ? {
              ...item,
              ...assignment,
            }
          : item,
      );
    });
  }

  // =========================================================
  // STATUS MAPPERS
  // =========================================================

  private toFrontendStatus(status: string): InspectorStatus {
    const normalized = status.toUpperCase();

    if (normalized === 'SUSPENDED') {
      return 'suspended';
    }

    if (normalized === 'INACTIVE' || normalized === 'ON_LEAVE') {
      return 'on_leave';
    }

    return 'active';
  }

  private toBackendInspectorStatus(status: InspectorStatus): string {
    switch (status) {
      case 'suspended':
        return 'SUSPENDED';

      case 'on_leave':
        return 'INACTIVE';

      case 'active':
      default:
        return 'ACTIVE';
    }
  }

  private toVerificationStatus(
    inspection: InspectionResponse,
  ): 'pending' | 'verified' | 'rejected' {
    if (inspection.result === 'APPROVED') {
      return 'verified';
    }

    if (inspection.result === 'REJECTED') {
      return 'rejected';
    }

    return 'pending';
  }

  // =========================================================
  // LOCAL PHOTO HELPERS
  // =========================================================

  addPhotos(assignmentId: string, photos: FarmPhoto[]): void {
    this._assignments.update((assignments) =>
      assignments.map((assignment) =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              photos: [...assignment.photos, ...photos],
            }
          : assignment,
      ),
    );
  }

  removePhoto(assignmentId: string, photoId: string): void {
    this._assignments.update((assignments) =>
      assignments.map((assignment) =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              photos: assignment.photos.filter((photo) => photo.id !== photoId),
            }
          : assignment,
      ),
    );
  }
}
