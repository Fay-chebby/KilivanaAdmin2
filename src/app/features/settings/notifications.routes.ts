import { Routes } from '@angular/router';
import { NotificationSettings } from './pages/notification-settings/notification-settings';

export const NOTIFICATION_ROUTES: Routes = [
  { path: '', component: NotificationSettings, title: 'Notifications' },
];
