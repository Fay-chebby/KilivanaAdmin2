export type BuyerStatus = 'verified' | 'pending' | 'suspended';
export type BuyerType = 'corporate' | 'individual';

export interface Buyer {
  id: string;
  code: string; // e.g. B-001
  name: string;
  email: string;
  phone?: string;
  address?: string;
  type: BuyerType;
  region: string;
  status: BuyerStatus;
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
