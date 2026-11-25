import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NotificationService } from '../../services/notification.service';

import { Notification, CreateNotificationRequest } from '../../models/notification.model';

type NotificationFilter = 'all' | 'unread' | 'read';

type RecipientType = 'all' | 'specific';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, NgClass, FormsModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications implements OnInit {
  private readonly service = inject(NotificationService);

  // ==========================================
  // NOTIFICATION STATE
  // ==========================================

  notifications = signal<Notification[]>([]);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  activeFilter = signal<NotificationFilter>('all');
  searchTerm = signal('');

  processingIds = signal<number[]>([]);
  deletingIds = signal<number[]>([]);

  markingAllAsRead = signal(false);

  // ==========================================
  // CREATE NOTIFICATION STATE
  // ==========================================

  showCreateModal = signal(false);
  creating = signal(false);
  createError = signal<string | null>(null);

  recipientType = signal<RecipientType>('all');

  newNotification = signal({
    userId: '',
    title: '',
    message: '',
    type: 'GENERAL',
  });

  // ==========================================
  // STATISTICS
  // ==========================================

  totalCount = computed(() => this.notifications().length);

  unreadCount = computed(() => this.notifications().filter((n) => !n.isRead).length);

  readCount = computed(() => this.notifications().filter((n) => n.isRead).length);

  // ==========================================
  // FILTERED NOTIFICATIONS
  // ==========================================

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

    return [...list].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
    });
  });

  // ==========================================
  // INITIALIZATION
  // ==========================================

  ngOnInit(): void {
    this.loadNotifications();
  }

  // ==========================================
  // LOAD NOTIFICATIONS
  // ==========================================

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

  // ==========================================
  // FILTER NOTIFICATIONS
  // ==========================================

  setFilter(filter: NotificationFilter): void {
    this.activeFilter.set(filter);
  }

  // ==========================================
  // SEARCH NOTIFICATIONS
  // ==========================================

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchTerm.set(value);
  }

  // ==========================================
  // MARK ONE NOTIFICATION AS READ
  // ==========================================

  markAsRead(notification: Notification): void {
    if (notification.isRead) return;

    if (this.processingIds().includes(notification.id)) {
      return;
    }

    this.error.set(null);

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

  // ==========================================
  // MARK ALL ADMIN NOTIFICATIONS AS READ
  // ==========================================

  markAllAsRead(): void {
    if (this.unreadCount() === 0) return;

    if (this.markingAllAsRead()) return;

    this.error.set(null);
    this.markingAllAsRead.set(true);

    this.service.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((n) => ({
            ...n,
            isRead: true,
          })),
        );

        this.markingAllAsRead.set(false);
      },

      error: (err) => {
        console.error('Failed to mark all as read:', err);

        this.markingAllAsRead.set(false);

        this.error.set('Could not mark all notifications as read.');
      },
    });
  }

  // ==========================================
  // DELETE NOTIFICATION
  // ==========================================

  deleteNotification(notification: Notification): void {
    if (this.deletingIds().includes(notification.id)) {
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete "${notification.title}"?`);

    if (!confirmed) return;

    this.error.set(null);

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

  // ==========================================
  // OPEN CREATE NOTIFICATION MODAL
  // ==========================================

  openCreateModal(): void {
    this.createError.set(null);

    this.newNotification.set({
      userId: '',
      title: '',
      message: '',
      type: 'GENERAL',
    });

    this.recipientType.set('all');
    this.showCreateModal.set(true);
  }

  // ==========================================
  // CLOSE CREATE NOTIFICATION MODAL
  // ==========================================

  closeCreateModal(): void {
    if (this.creating()) return;

    this.showCreateModal.set(false);
    this.createError.set(null);
  }

  // ==========================================
  // CHANGE RECIPIENT TYPE
  // ==========================================

  setRecipientType(value: RecipientType): void {
    this.recipientType.set(value);
    this.createError.set(null);
  }

  // ==========================================
  // UPDATE CREATE FORM FIELDS
  // ==========================================

  updateNotificationField(field: 'userId' | 'title' | 'message' | 'type', value: string): void {
    this.newNotification.update((current) => ({
      ...current,
      [field]: value,
    }));

    this.createError.set(null);
  }

  // ==========================================
  // CREATE NOTIFICATION
  // ==========================================

  // ==========================================
  // CREATE NOTIFICATION
  // SUPPORTS SPECIFIC USER AND BROADCAST
  // ==========================================

  createNotification(): void {
    if (this.creating()) return;

    const form = this.newNotification();

    const title = form.title.trim();
    const message = form.message.trim();

    // Validate title
    if (!title) {
      this.createError.set('Please enter a notification title.');
      return;
    }

    // Validate message
    if (!message) {
      this.createError.set('Please enter a notification message.');
      return;
    }

    const payload = {
      title,
      message,
      type: form.type,
    };

    this.creating.set(true);
    this.createError.set(null);

    // ==========================================
    // BROADCAST TO ALL USERS
    // ==========================================

    if (this.recipientType() === 'all') {
      this.service.broadcastNotification(payload).subscribe({
        next: (response) => {
          console.log('Broadcast notification response:', response);

          this.creating.set(false);
          this.showCreateModal.set(false);

          this.success.set('Broadcast notification sent successfully.');

          this.loadNotifications();
        },

        error: (err) => {
          console.error('Failed to send broadcast notification:', err);

          this.creating.set(false);

          this.createError.set(
            err?.error?.message ?? 'Could not send broadcast notification. Please try again.',
          );
        },
      });

      return;
    }

    // ==========================================
    // SEND TO ONE SPECIFIC USER
    // ==========================================

    const parsedUserId = Number(form.userId);

    if (!form.userId.trim() || !Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      this.creating.set(false);
      this.createError.set('Please enter a valid user ID.');
      return;
    }

    this.service
      .createNotification({
        ...payload,
        userId: parsedUserId,
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.showCreateModal.set(false);

          this.success.set('Notification sent successfully.');

          this.loadNotifications();
        },

        error: (err) => {
          console.error('Failed to create notification:', err);

          this.creating.set(false);

          this.createError.set(
            err?.error?.message ?? 'Could not create notification. Please try again.',
          );
        },
      });
  }

  // ==========================================
  // NOTIFICATION ICON
  // ==========================================

  getIcon(type: string): string {
    const value = type.toLowerCase();

    if (value.includes('order')) return 'shopping-bag';

    if (value.includes('payment') || value.includes('payout')) {
      return 'wallet';
    }

    if (value.includes('farmer')) return 'users';

    if (value.includes('inspection') || value.includes('kyc')) {
      return 'clipboard-check';
    }

    if (value.includes('product')) return 'package';

    if (value.includes('dispute')) return 'alert-triangle';

    if (value.includes('system')) return 'settings';

    return 'bell';
  }

  // ==========================================
  // NOTIFICATION COLOR
  // ==========================================

  getTypeClass(type: string): string {
    const value = type.toLowerCase();

    if (value.includes('order')) return 'type--blue';

    if (value.includes('payment') || value.includes('payout')) {
      return 'type--green';
    }

    if (value.includes('dispute')) return 'type--red';

    if (value.includes('inspection') || value.includes('kyc')) {
      return 'type--amber';
    }

    return 'type--neutral';
  }

  // ==========================================
  // HUMAN-READABLE NOTIFICATION TYPE
  // ==========================================

  formatType(type: string): string {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
