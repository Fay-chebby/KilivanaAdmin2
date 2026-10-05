import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { ApiResponse, AuthData, AuthUser, LoginRequest } from '../models/auth.model';

const STORAGE_KEY = 'kilivana_admin_session';

const API_BASE_URL = 'https://kilivana-backend-a44w.onrender.com/api/v1';

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _currentUser = signal<AuthUser | null>(this.readUser());

  readonly currentUser = this._currentUser.asReadonly();

  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');

  login(request: LoginRequest): Observable<ApiResponse<AuthData>> {
    return this.http.post<ApiResponse<AuthData>>(`${API_BASE_URL}/auth/login`, request).pipe(
      tap((response) => {
        const session: StoredSession = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          user: response.data.user,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

        this._currentUser.set(response.data.user);
      }),
    );
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(
      `${API_BASE_URL}/auth/forgot-password`,
      {},
      {
        params: {
          email: email.trim(),
        },
      },
    );
  }

  logout(): void {
    const accessToken = this.getAccessToken();

    if (accessToken) {
      this.http
        .post(
          `${API_BASE_URL}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )
        .subscribe({
          complete: () => this.clearSession(),
          error: () => this.clearSession(),
        });
    } else {
      this.clearSession();
    }
  }

  getAccessToken(): string | null {
    const session = this.readSession();

    return session?.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    const session = this.readSession();

    return session?.refreshToken ?? null;
  }

  getCurrentUser(): AuthUser | null {
    return this._currentUser();
  }

  private clearSession(): void {
    this._currentUser.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private readSession(): StoredSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as StoredSession;
    } catch {
      return null;
    }
  }

  private readUser(): AuthUser | null {
    return this.readSession()?.user ?? null;
  }
}
