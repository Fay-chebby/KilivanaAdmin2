import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { ApiResponse, AuditLogDto, AuditRow, PageDto } from '../models/settings.model';

interface UserLite {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private api = ' https://either-juvenile-progeny.ngrok-free.dev/api/v1/admin';

  getAuditLog(page = 0, size = 10): Observable<{ rows: AuditRow[]; totalPages: number }> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');

    const logs$ = this.http.get<ApiResponse<PageDto<AuditLogDto>>>(`${this.api}/audit-logs`, {
      params,
    });

    const users$ = this.http
      .get<ApiResponse<UserLite[]>>(`${this.api}/users`, {
        params: new HttpParams().set('page', 0).set('size', 500),
      })
      .pipe(
        map((r) => r.data ?? []),
        catchError(() => of([] as UserLite[])),
      );

    return forkJoin({ logs: logs$, users: users$ }).pipe(
      map(({ logs, users }) => {
        const names = new Map(users.map((u) => [u.id, u.name]));
        const rows: AuditRow[] = (logs.data?.content ?? []).map((l) => ({
          id: l.id,
          timestamp: l.createdAt,
          staff: names.get(l.actorId) ?? `User #${l.actorId}`,
          action: this.humanize(l.action),
          target: l.entityType ? `${l.entityType} #${l.entityId}` : '—',
        }));
        return { rows, totalPages: logs.data?.totalPages ?? 1 };
      }),
    );
  }

  private humanize(action: string): string {
    const s = (action ?? '').replace(/_/g, ' ').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
