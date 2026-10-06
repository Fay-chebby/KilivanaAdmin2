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
