import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth-guard';
import { Login } from './pages/login/login';
import { ForgotPassword } from './pages/forgot-password/forgot-password';

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPassword, canActivate: [guestGuard] },
];
