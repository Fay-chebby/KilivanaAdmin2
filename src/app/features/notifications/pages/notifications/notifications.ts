import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { DatePipe, NgClass } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/notification.model';

type NotificationFilter = 'all' | 'unread' | 'read';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, NgClass],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications implements OnInit {
  private service = inject(NotificationService);

  // State
  notifications = signal<Notification[]>([]);

  loading = signal(false);
  error = signal<string | null>(null);

  activeFilter = signal<NotificationFilter>('all');
  searchTerm = signal('');

  processingIds = signal<number[]>([]);
  deletingIds = signal<number[]>([]);

  // Statistics
  totalCount = computed(() => this.notifications().length);

  unreadCount = computed(() => this.notifications().filter((n) => !n.isRead).length);

  readCount = computed(() => this.notifications().filter((n) => n.isRead).length);

  // Filtered notifications
  filteredNotifications = computed(() => {
    let list = this.notifications();

    const filter = this.activeFilter();

    if (filter === 'unread') {
      list = list.filter((n) => !n.isRead);
    } else if (filter === 'read') {
      list = list.filter((n) => n.isRead);
    }

    const search = this.searchTerm().trim().toLowerCase();

    if (search) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.message.toLowerCase().includes(search) ||
          n.type.toLowerCase().includes(search),
      );
    }

    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });

  ngOnInit(): void {
    this.loadNotifications();
  }

  // Load notifications
  loadNotifications(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getNotifications().subscribe({
      next: (data) => {
        this.notifications.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);

        this.error.set(err?.error?.message ?? 'Failed to load notifications.');

        this.loading.set(false);
      },
    });
  }

  // Change filter
  setFilter(filter: NotificationFilter): void {
    this.activeFilter.set(filter);
  }

  // Search
  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  // Mark one as read
  markAsRead(notification: Notification): void {
    if (notification.isRead) return;
    if (this.processingIds().includes(notification.id)) return;

    this.processingIds.update((ids) => [...ids, notification.id]);

    this.service.markAsRead(notification.id).subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
        );

        this.processingIds.update((ids) => ids.filter((id) => id !== notification.id));
      },
      error: (err) => {
        console.error('Failed to mark notification as read:', err);

        this.processingIds.update((ids) => ids.filter((id) => id !== notification.id));

        this.error.set('Could not mark notification as read.');
      },
    });
  }

  // Mark all my notifications as read
  markAllAsRead(): void {
    if (this.unreadCount() === 0) return;

    this.service.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
      },
      error: (err) => {
        console.error('Failed to mark all as read:', err);
        this.error.set('Could not mark all notifications as read.');
      },
    });
  }

  // Delete notification
  deleteNotification(notification: Notification): void {
    if (this.deletingIds().includes(notification.id)) return;

    const confirmed = window.confirm(`Are you sure you want to delete "${notification.title}"?`);

    if (!confirmed) return;

    this.deletingIds.update((ids) => [...ids, notification.id]);

    this.service.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications.update((list) => list.filter((n) => n.id !== notification.id));

        this.deletingIds.update((ids) => ids.filter((id) => id !== notification.id));
      },
      error: (err) => {
        console.error('Failed to delete notification:', err);

        this.deletingIds.update((ids) => ids.filter((id) => id !== notification.id));

        this.error.set('Could not delete notification.');
      },
    });
  }

  // Notification icon
  getIcon(type: string): string {
    const value = type.toLowerCase();

    if (value.includes('order')) return 'shopping-bag';
    if (value.includes('payment') || value.includes('payout')) return 'wallet';
    if (value.includes('farmer')) return 'users';
    if (value.includes('inspection') || value.includes('kyc')) return 'clipboard-check';
    if (value.includes('product')) return 'package';
    if (value.includes('dispute')) return 'alert-triangle';
    if (value.includes('system')) return 'settings';

    return 'bell';
  }

  // Notification color
  getTypeClass(type: string): string {
    const value = type.toLowerCase();

    if (value.includes('order')) return 'type--blue';
    if (value.includes('payment') || value.includes('payout')) return 'type--green';
    if (value.includes('dispute')) return 'type--red';
    if (value.includes('inspection') || value.includes('kyc')) return 'type--amber';

    return 'type--neutral';
  }

  // Human-readable type
  formatType(type: string): string {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
