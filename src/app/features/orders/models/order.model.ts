/* -----------------------------
   Order status types
----------------------------- */

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'HELD' | 'PAID' | 'FAILED' | 'REFUNDED';

export type Tone = 'green' | 'blue' | 'amber' | 'red' | 'gray';

export type PaymentMethod = 'mpesa' | 'card' | 'bank';
/* -----------------------------
   Buyer information
----------------------------- */

export interface OrderBuyer {
  id?: number;

  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;

  email?: string | null;
  phone?: string | null;
}

/* -----------------------------
   Seller information
----------------------------- */
export interface OrderStats {
  totalOrders: number;
  placed: number;
  confirmed: number;
  processing: number;
  delivered: number;
  cancelled: number;
}
export interface OrderSeller {
  id?: number;

  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;

  businessName?: string | null;

  phone?: string | null;
  email?: string | null;
}

/* -----------------------------
   Driver information
----------------------------- */

export interface OrderDriver {
  id?: number;

  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  name?: string | null;

  phone?: string | null;
  email?: string | null;

  vehicle?: string | null;
  vehicleType?: string | null;
  plateNumber?: string | null;
  registrationNumber?: string | null;
}

/* -----------------------------
   Delivery information
----------------------------- */

export type DeliveryStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface OrderDelivery {
  id?: number;

  driverId?: number | null;
  driver?: OrderDriver | null;

  distanceKm?: number | null;

  deliveryStatus?: DeliveryStatus | string | null;

  deliveryAddress?: string | null;
  pickupAddress?: string | null;

  estimatedDeliveryTime?: string | null;
  actualDeliveryTime?: string | null;

  latitude?: number | null;
  longitude?: number | null;
}

/* -----------------------------
   Address information
----------------------------- */

export interface OrderAddress {
  id?: number;

  recipientName?: string | null;
  recipientPhone?: string | null;

  address?: string | null;
  street?: string | null;
  town?: string | null;
  county?: string | null;
  region?: string | null;
  postalCode?: string | null;

  latitude?: number | null;
  longitude?: number | null;
}

/* -----------------------------
   Order items
----------------------------- */

export interface OrderItem {
  id: number;

  productId: number;

  sellerId?: number;

  // Optional nested seller information.
  seller?: OrderSeller | null;

  productName?: string | null;

  unit?: string | null;

  quantity: number;

  unitPrice: number;

  subtotal: number;
}

/* -----------------------------
   Main order interface
----------------------------- */

export interface Order {
  id: number;
  code: string;

  /* Buyer */

  buyerId: number;

  // These are returned directly by the backend.
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerCounty?: string | null;

  // Optional nested buyer information.
  buyer?: OrderBuyer | null;

  /* Seller */

  // These are returned directly by the backend.
  sellerName?: string | null;
  sellerPhone?: string | null;
  sellerCounty?: string | null;
  sellerLocation?: string | null;

  // Optional nested seller information.
  seller?: OrderSeller | null;

  /* Order status */

  status: OrderStatus;

  /* Financial information */

  subtotal: number;
  deliveryFee: number;
  total: number;

  paymentStatus: PaymentStatus | string;

  paymentMethod?: PaymentMethod | string | null;
  paymentReference?: string | null;
  paidAt?: string | null;

  /* Delivery and pickup */

  addressId?: number | null;
  pickupStationId?: number | null;
  pickupLocation?: string | null;
  deliveryAddress?: string | null;

  delivery?: OrderDelivery | null;
  address?: OrderAddress | null;

  /* Driver */

  driverId?: number | null;
  driverName?: string | null;
  driverPhone?: string | null;
  driverVehicle?: string | null;
  driverPlate?: string | null;

  driver?: OrderDriver | null;

  /* Delivery tracking */

  deliveryStatus?: DeliveryStatus | string | null;
  logisticsJobId?: number | null;

  /* Cancellation */

  cancellationReason?: string | null;

  /* Order items */

  items: OrderItem[];

  /* Timestamps */

  createdAt?: string | null;
  updatedAt?: string | null;
}

/* -----------------------------
   Pagination
----------------------------- */

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

/* -----------------------------
   API response
----------------------------- */

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
   Order status UI metadata
----------------------------- */

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  PLACED: {
    label: 'Placed',
    tone: 'amber',
  },

  CONFIRMED: {
    label: 'Confirmed',
    tone: 'blue',
  },

  PROCESSING: {
    label: 'Processing',
    tone: 'blue',
  },

  IN_TRANSIT: {
    label: 'In Transit',
    tone: 'blue',
  },

  DELIVERED: {
    label: 'Delivered',
    tone: 'green',
  },

  COMPLETED: {
    label: 'Completed',
    tone: 'green',
  },

  DISPUTED: {
    label: 'Disputed',
    tone: 'red',
  },

  CANCELLED: {
    label: 'Cancelled',
    tone: 'red',
  },
};

/* -----------------------------
   Status dropdown options
----------------------------- */

export const STATUS_OPTIONS: Array<{
  value: OrderStatus;
  label: string;
}> = [
  { value: 'PLACED', label: 'Placed' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DISPUTED', label: 'Disputed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

/* -----------------------------
   Payment UI metadata
----------------------------- */

export const PAYMENT_META: Record<PaymentStatus, { label: string; tone: Tone }> = {
  PENDING: {
    label: 'Pending',
    tone: 'amber',
  },

  HELD: {
    label: 'Held',
    tone: 'blue',
  },

  PAID: {
    label: 'Paid',
    tone: 'green',
  },

  FAILED: {
    label: 'Failed',
    tone: 'red',
  },

  REFUNDED: {
    label: 'Refunded',
    tone: 'gray',
  },
};

/* -----------------------------
   Payment method labels
----------------------------- */

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  mpesa: 'M-Pesa',
  bank: 'Bank',
  card: 'Card',
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

  const firstProduct = order.items[0].productName || 'Product';

  if (order.items.length === 1) {
    return firstProduct;
  }

  return `${firstProduct} + ${order.items.length - 1} more`;
}

export function qtySummary(order: Order): string {
  if (!order.items?.length) {
    return '0';
  }

  return String(order.items.reduce((total, item) => total + Number(item.quantity || 0), 0));
}

/* -----------------------------
   Buyer / Seller / Driver helpers
----------------------------- */

export function buyerName(buyer?: OrderBuyer | null): string {
  if (!buyer) {
    return 'Unknown buyer';
  }

  return (
    buyer.fullName ||
    [buyer.firstName, buyer.lastName].filter(Boolean).join(' ') ||
    `Buyer #${buyer.id ?? ''}`
  );
}

export function sellerName(seller?: OrderSeller | null): string {
  if (!seller) {
    return 'Unknown seller';
  }

  return (
    seller.businessName ||
    seller.name ||
    seller.fullName ||
    [seller.firstName, seller.lastName].filter(Boolean).join(' ') ||
    `Seller #${seller.id ?? ''}`
  );
}

export function driverName(driver?: OrderDriver | null): string {
  if (!driver) {
    return 'No driver assigned';
  }

  return (
    driver.fullName ||
    driver.name ||
    [driver.firstName, driver.lastName].filter(Boolean).join(' ') ||
    `Driver #${driver.id ?? ''}`
  );
}

/* -----------------------------
   Business calculations
----------------------------- */

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
   Normal order pipeline
----------------------------- */
export const PIPELINE: OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
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
