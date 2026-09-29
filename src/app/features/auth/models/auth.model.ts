import { UserRole } from '../../../core/models/user.model';

export interface AdminUser {
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
