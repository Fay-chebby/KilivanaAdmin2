import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import {
  ApiResponse,
  AuditLogDto,
  AuditRow,
  PageDto,
  PlatformSettingRequest,
  PlatformSettingResponse,
} from '../models/settings.model';

import { API_BASE } from '../../../core/config/api.config';

interface UserLite {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly http = inject(HttpClient);

  private readonly settingsEndpoint = `${API_BASE}/admin/settings`;
  private readonly auditEndpoint = `${this.settingsEndpoint}/audit-logs`;

  // GET /api/v1/admin/settings
  getSettings(): Observable<PlatformSettingResponse> {
    return this.http
      .get<ApiResponse<PlatformSettingResponse>>(this.settingsEndpoint)
      .pipe(map((response) => response.data));
  }

  // PUT /api/v1/admin/settings
  updateSettings(payload: PlatformSettingRequest): Observable<PlatformSettingResponse> {
    return this.http
      .put<ApiResponse<PlatformSettingResponse>>(this.settingsEndpoint, payload)
      .pipe(map((response) => response.data));
  }

  // GET /api/v1/admin/settings/audit-logs
  getAuditLog(page = 0, size = 10): Observable<{ rows: AuditRow[]; totalPages: number }> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');

    const logs$ = this.http.get<ApiResponse<PageDto<AuditLogDto>>>(this.auditEndpoint, { params });

    const users$ = this.http
      .get<ApiResponse<UserLite[]>>(`${API_BASE}/users`, {
        params: new HttpParams().set('page', 0).set('size', 500),
      })
      .pipe(
        map((response) => response.data ?? []),
        catchError(() => of([] as UserLite[])),
      );

    return forkJoin({ logs: logs$, users: users$ }).pipe(
      map(({ logs, users }) => {
        const names = new Map(users.map((user) => [user.id, user.name]));

        const rows: AuditRow[] = (logs.data?.content ?? []).map((log) => ({
          id: log.id,
          timestamp: log.createdAt,
          staff: names.get(log.actorId) ?? `User #${log.actorId}`,
          action: this.humanize(log.action),
          target: log.entityType ? `${log.entityType} #${log.entityId}` : '—',
        }));

        return {
          rows,
          totalPages: logs.data?.totalPages ?? 1,
        };
      }),
    );
  }

  // GET /api/v1/admin/settings/audit-logs/{id}
  getAuditLogById(id: number): Observable<AuditLogDto> {
    return this.http
      .get<ApiResponse<AuditLogDto>>(`${this.auditEndpoint}/${id}`)
      .pipe(map((response) => response.data));
  }

  private humanize(action: string): string {
    const value = (action ?? '').replace(/_/g, ' ').toLowerCase();
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
