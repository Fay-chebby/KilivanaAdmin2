export type BuyerStatus = 'verified' | 'pending' | 'suspended';
export type BuyerType = 'corporate' | 'individual';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error?: { code: string; details: string };
}

// Exactly what the backend returns
export interface BuyerDto {
  userId: number;
  profileId: number;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  region: string;
  address: string;
  status: string;
  type: string;
  ordersCount: number;
  totalSpend: number;
  disputesCount: number;
  createdAt: string;
}

// What the UI uses
export interface Buyer {
  id: number; // userId
  profileId: number;
  code: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  address: string;
  status: BuyerStatus;
  type: BuyerType;
  ordersCount: number;
  totalSpend: number;
  disputesCount: number;
  createdAt: string;
}

export interface BuyerStats {
  total: number;
  verified: number;
  pending: number;
  suspended: number;
  totalSpend: number;
}

export interface BuyerOrderItem {
  id: number;
  productId: number;
  sellerId: number;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BuyerOrder {
  id: number;
  code: string;
  buyerId: number;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  buyerName: string;
  sellerName: string;
  paymentMethod: string;
  deliveryAddress: string | null;
  deliveryStatus: string | null;
  createdAt: string;
  updatedAt: string;
  items: BuyerOrderItem[];
}
