import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_BASE } from '../../../core/config/api.config';

import {
  Notification,
  NotificationDto,
  NotificationEnvelope,
  NotificationPageDto,
} from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);

  private readonly endpoint = `${API_BASE}/admin/notifications`;

  // Get all notifications
  getNotifications(): Observable<Notification[]> {
    return this.http
      .get<NotificationEnvelope<NotificationDto[] | NotificationPageDto>>(this.endpoint)
      .pipe(
        map((response) => {
          const data = response.data;

          const items = Array.isArray(data) ? data : (data?.content ?? []);

          return items.map((item) => this.mapNotification(item));
        }),
      );
  }

  // Get unread notifications for a particular user
  getUnreadNotifications(userId: number): Observable<Notification[]> {
    return this.http
      .get<NotificationEnvelope<NotificationDto[]>>(`${this.endpoint}/user/${userId}/unread`)
      .pipe(map((response) => (response.data ?? []).map((item) => this.mapNotification(item))));
  }

  // Get notifications belonging to a particular user
  getUserNotifications(userId: number): Observable<Notification[]> {
    return this.http
      .get<NotificationEnvelope<NotificationDto[]>>(`${this.endpoint}/user/${userId}`)
      .pipe(map((response) => (response.data ?? []).map((item) => this.mapNotification(item))));
  }

  // Get one notification
  getNotification(id: number): Observable<Notification> {
    return this.http
      .get<NotificationEnvelope<NotificationDto>>(`${this.endpoint}/${id}`)
      .pipe(map((response) => this.mapNotification(response.data)));
  }

  // Mark one notification as read
  markAsRead(id: number): Observable<any> {
    return this.http.post(`${this.endpoint}/${id}/read`, {});
  }

  // Mark all my notifications as read
  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.endpoint}/read-all`, {});
  }

  // Mark all notifications belonging to a particular user as read
  markUserNotificationsAsRead(userId: number): Observable<any> {
    return this.http.post(`${this.endpoint}/user/${userId}/read-all`, {});
  }

  // Delete notification
  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${this.endpoint}/${id}`);
  }

  // Convert backend DTO into frontend notification model
  private mapNotification(dto: NotificationDto): Notification {
    return {
      id: dto.id,
      userId: dto.userId,
      title: dto.title ?? this.humanize(dto.type ?? 'Notification'),
      message: dto.message ?? dto.body ?? '',
      type: dto.type ?? dto.category ?? 'GENERAL',
      isRead: dto.isRead ?? dto.read ?? false,
      createdAt: dto.createdAt ?? dto.timestamp ?? '',
    };
  }

  private humanize(value: string): string {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
