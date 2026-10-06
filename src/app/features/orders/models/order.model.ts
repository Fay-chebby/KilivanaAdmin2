export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type Tone = 'green' | 'blue' | 'amber' | 'red' | 'gray';

export type PaymentMethod = 'mpesa' | 'card' | 'cash' | 'bank';

export interface OrderItem {
  id: number;
  productId: number;
  sellerId: number;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  code: string;
  buyerId: number;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: PaymentStatus;
  addressId: number;
  cancellationReason: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SortInfo {
  sorted: boolean;
  empty: boolean;
  unsorted: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  offset: number;
  sort: SortInfo;
  unpaged: boolean;
  paged: boolean;
}

export interface OrderPage {
  totalElements: number;
  totalPages: number;
  pageable: Pageable;
  size: number;
  content: Order[];
  number: number;
  sort: SortInfo;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error: {
    code: string;
    details: string;
  } | null;
}

/* -----------------------------
   UI metadata
----------------------------- */

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  placed: {
    label: 'Placed',
    tone: 'amber',
  },
  confirmed: {
    label: 'Confirmed',
    tone: 'blue',
  },
  processing: {
    label: 'Processing',
    tone: 'blue',
  },
  shipped: {
    label: 'Shipped',
    tone: 'blue',
  },
  delivered: {
    label: 'Delivered',
    tone: 'green',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'red',
  },
};

export const STATUS_OPTIONS: Array<{
  value: OrderStatus;
  label: string;
}> = [
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const PAYMENT_META: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pending: {
    label: 'Pending',
    tone: 'amber',
  },
  paid: {
    label: 'Paid',
    tone: 'green',
  },
  failed: {
    label: 'Failed',
    tone: 'red',
  },
  refunded: {
    label: 'Refunded',
    tone: 'gray',
  },
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  mpesa: 'M-Pesa',
  card: 'Card',
  cash: 'Cash',
  bank: 'Bank',
};

/* -----------------------------
   Order calculations
----------------------------- */

export function subtotal(order: Order): number {
  return Number(order.subtotal || 0);
}

export function productSummary(order: Order): string {
  if (!order.items?.length) {
    return '—';
  }

  if (order.items.length === 1) {
    return order.items[0].productName;
  }

  return `${order.items[0].productName} + ${order.items.length - 1} more`;
}

export function qtySummary(order: Order): string {
  if (!order.items?.length) {
    return '0';
  }

  return String(order.items.reduce((total, item) => total + Number(item.quantity || 0), 0));
}

/*
 * These are UI/business calculations only.
 * They are NOT fields returned by the backend.
 */

export const PLATFORM_FEE_RATE = 0.05;

export function platformFee(order: Order): number {
  return Number(order.subtotal || 0) * PLATFORM_FEE_RATE;
}

export function farmerPayout(order: Order): number {
  return Number(order.subtotal || 0) - platformFee(order);
}

/* -----------------------------
   Order pipeline
----------------------------- */

export const PIPELINE: OrderStatus[] = [
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

/* -----------------------------
   Timeline
----------------------------- */

export interface OrderEvent {
  id: string | number;
  status?: OrderStatus;
  text: string;
  createdAt: string;
}
