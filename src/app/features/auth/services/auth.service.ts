import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AdminUser, LoginRequest } from '../models/auth.model';

const STORAGE_KEY = 'kilivana_admin_session';

/**
 * TEMPORARY: no backend yet, so credentials are hardcoded here and the "session" is just
 * the user object saved to localStorage. Replace ADMIN_ACCOUNTS and the body of login()
 * with a real HttpClient call once the API exists — everything that reads currentUser()
 * / isAuthenticated() elsewhere in the app will keep working unchanged.
 */
const ADMIN_ACCOUNTS: Array<{ email: string; password: string; user: AdminUser }> = [
  {
    email: 'admin@kilivana.com',
    password: 'Admin@123',
    user: {
      id: 'ADM-001',
      fullName: 'Faith Chebet',
      email: 'admin@kilivana.com',
      role: 'admin',
      initials: 'FC',
    },
  },
  {
    email: 'superadmin@kilivana.com',
    password: 'SuperAdmin@123',
    user: {
      id: 'ADM-000',
      fullName: 'Kwame Boateng',
      email: 'superadmin@kilivana.com',
      role: 'super-admin',
      initials: 'KB',
    },
  },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<AdminUser | null>(this.readSession());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isSuperAdmin = computed(() => this._currentUser()?.role === 'super-admin');

  login(request: LoginRequest): Observable<AdminUser> {
    const match = ADMIN_ACCOUNTS.find(
      (a) =>
        a.email.toLowerCase() === request.email.trim().toLowerCase() &&
        a.password === request.password,
    );

    if (!match) {
      return throwError(() => new Error('Invalid email or password.')).pipe(delay(500));
    }

    return of(match.user).pipe(
      delay(500),
      tap((user) => {
        this._currentUser.set(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      }),
    );
  }

  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * TEMPORARY mock: no email service yet, so this just checks the address is one of the
   * known admin accounts and pretends a reset link was sent. Replace with a real
   * HttpClient call once the backend exposes a "forgot password" endpoint. Keep resolving
   * even for unknown emails in the real version, so the UI can't be used to find out which
   * emails are registered — this mock is intentionally stricter, only to help you test both states.
   */
  requestPasswordReset(email: string): Observable<void> {
    const exists = ADMIN_ACCOUNTS.some((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    return exists
      ? of(undefined).pipe(delay(600))
      : throwError(() => new Error('No admin account found with that email.')).pipe(delay(600));
  }

  private readSession(): AdminUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AdminUser) : null;
    } catch {
      return null;
    }
  }
}
