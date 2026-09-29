import { Component, output, signal } from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-topbar',
  imports: [Icon],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss'
})
export class Topbar {
  readonly toggleSidebar = output<void>();

  // TODO: replace with data from AuthService once it exists.
  readonly user = signal({ name: 'Abena', initials: 'AM', role: 'Administrator' });
  readonly unreadNotifications = signal(1);
}