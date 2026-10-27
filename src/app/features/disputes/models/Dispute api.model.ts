/** Shapes copied from the Kilivana backend API (OpenAPI 1.0.0). */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  error?: { code: string; details: string } | null;
}

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  last: boolean;
}

export interface DisputeDto {
  id: number;
  orderId: number;
  raisedBy: number;
  reason: string;
  description?: string | null;
  status: string; // open | in_progress | resolved | closed
  resolution?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/** Only the order fields a dispute screen needs */
export interface OrderLiteDto {
  id: number;
  code?: string | null;
  buyerId: number;
  status: string;
  subtotal?: number | null;
  total?: number | null;
  paymentStatus?: string | null;
  buyerName?: string | null;
  buyerPhone?: string | null;
  sellerName?: string | null;
  sellerPhone?: string | null;
  items?: { sellerId: number }[] | null;
}

export interface ResolutionRequestDto {
  outcome: 'BUYER' | 'FARMER';
  resolution: string;
}
export interface NotificationRequestDto {
  userId: number;
  type: string;
  title: string;
  message: string;
}
