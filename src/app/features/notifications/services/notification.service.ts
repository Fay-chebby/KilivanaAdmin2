import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_BASE } from '../../../core/config/api.config';

import {
  Notification,
  NotificationDto,
  NotificationEnvelope,
  NotificationPageDto,
  CreateNotificationRequest,
} from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);

  private readonly endpoint = `${API_BASE}/admin/notifications`;

  // ==========================================
  // GET ALL NOTIFICATIONS
  // GET /api/v1/admin/notifications
  // ==========================================

  getNotifications(): Observable<Notification[]> {
    return this.http
      .get<NotificationEnvelope<NotificationDto[] | NotificationPageDto>>(this.endpoint)
      .pipe(
        map((response) => {
          const data = response?.data;

          const items: NotificationDto[] = Array.isArray(data) ? data : (data?.content ?? []);

          return items.map((item) => this.mapNotification(item));
        }),
      );
  }

  // ==========================================
  // GET ONE NOTIFICATION
  // GET /api/v1/admin/notifications/{id}
  // ==========================================

  getNotification(id: number): Observable<Notification> {
    return this.http
      .get<NotificationEnvelope<NotificationDto>>(`${this.endpoint}/${id}`)
      .pipe(map((response) => this.mapNotification(response.data)));
  }

  // ==========================================
  // GET NOTIFICATIONS FOR A USER
  // GET /api/v1/admin/notifications/user/{userId}
  // ==========================================

  getUserNotifications(userId: number): Observable<Notification[]> {
    return this.http
      .get<NotificationEnvelope<NotificationDto[]>>(`${this.endpoint}/user/${userId}`)
      .pipe(map((response) => (response.data ?? []).map((item) => this.mapNotification(item))));
  }

  // ==========================================
  // GET UNREAD NOTIFICATIONS FOR A USER
  // GET /api/v1/admin/notifications/user/{userId}/unread
  // ==========================================

  getUnreadNotifications(userId: number): Observable<Notification[]> {
    return this.http
      .get<NotificationEnvelope<NotificationDto[]>>(`${this.endpoint}/user/${userId}/unread`)
      .pipe(map((response) => (response.data ?? []).map((item) => this.mapNotification(item))));
  }

  // ==========================================
  // CREATE NOTIFICATION
  // POST /api/v1/admin/notifications
  // ==========================================

  createNotification(payload: CreateNotificationRequest): Observable<unknown> {
    return this.http.post(this.endpoint, payload);
  }

  // ==========================================
  // MARK ONE NOTIFICATION AS READ
  // POST /api/v1/admin/notifications/{id}/read
  // ==========================================

  markAsRead(id: number): Observable<unknown> {
    return this.http.post(`${this.endpoint}/${id}/read`, {});
  }

  // ==========================================
  // MARK ADMIN'S NOTIFICATIONS AS READ
  // POST /api/v1/admin/notifications/read-all
  // ==========================================

  markAllAsRead(): Observable<unknown> {
    return this.http.post(`${this.endpoint}/read-all`, {});
  }

  // ==========================================
  // MARK A USER'S NOTIFICATIONS AS READ
  // POST /api/v1/admin/notifications/user/{userId}/read-all
  // ==========================================

  markUserNotificationsAsRead(userId: number): Observable<unknown> {
    return this.http.post(`${this.endpoint}/user/${userId}/read-all`, {});
  }

  // ==========================================
  // DELETE NOTIFICATION
  // DELETE /api/v1/admin/notifications/{id}
  // ==========================================

  deleteNotification(id: number): Observable<unknown> {
    return this.http.delete(`${this.endpoint}/${id}`);
  }

  // ==========================================
  // MAP BACKEND DTO TO FRONTEND MODEL
  // ==========================================

  private mapNotification(dto: NotificationDto): Notification {
    return {
      id: dto.id,
      userId: dto.userId,

      title: dto.title?.trim() || this.humanize(dto.type ?? dto.category ?? 'Notification'),

      message: dto.message ?? dto.body ?? '',

      type: dto.type ?? dto.category ?? 'GENERAL',

      isRead: dto.isRead ?? dto.read ?? false,

      createdAt: dto.createdAt ?? dto.timestamp ?? '',
    };
  }

  // ==========================================
  // FORMAT ENUM VALUES FOR DISPLAY
  // ==========================================

  private humanize(value: string): string {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
