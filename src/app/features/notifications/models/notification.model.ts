export interface NotificationDto {
  id: number;
  userId?: number;
  title?: string;
  message?: string;
  body?: string;
  type?: string;
  category?: string;
  read?: boolean;
  isRead?: boolean;
  readAt?: string | null;
  createdAt?: string;
  timestamp?: string;
}

export interface Notification {
  id: number;
  userId?: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface NotificationPageDto {
  content: NotificationDto[];
  totalPages?: number;
  totalElements?: number;
  number?: number;
}
export interface CreateNotificationRequest {
  userId?: number;
  title: string;
  message: string;
  type: string;
}
