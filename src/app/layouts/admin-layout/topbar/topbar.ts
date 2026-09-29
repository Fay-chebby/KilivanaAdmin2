import { Component, computed, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { Icon } from '../../../shared/components/icon/icon';
import { AuthService } from '../../../features/auth/services/auth.service';

@Component({
  selector: 'app-topbar',
  imports: [Icon],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly toggleSidebar = output<void>();

  readonly user = computed(() => {
    const u = this.auth.currentUser();
    return {
      name: u?.fullName.split(' ')[0] ?? 'Admin',
      initials: u?.initials ?? 'AD',
      role: u?.role === 'super-admin' ? 'Super Admin' : 'Administrator',
    };
  });

  readonly unreadNotifications = 1;

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
