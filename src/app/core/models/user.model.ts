export type UserRole = 'super-admin' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  initials: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string; // ISO date
}
