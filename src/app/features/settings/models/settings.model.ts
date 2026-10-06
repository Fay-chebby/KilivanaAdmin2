export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error?: { code: string; details: string };
}

export interface AuditLogDto {
  id: number;
  actorId: number;
  action: string;
  entityType: string;
  entityId: number;
  metadata: string;
  createdAt: string;
}

export interface PageDto<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface AuditRow {
  id: number;
  timestamp: string;
  staff: string;
  action: string;
  target: string;
}
