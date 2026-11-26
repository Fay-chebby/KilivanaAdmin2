export type SellerType = 'FARMER' | 'SUPPLIER';

/** A farmer's or supplier's wallet. Every figure is calculated by the backend from the ledger. */
export interface SellerWallet {
  sellerId: string;
  sellerName: string;
  sellerType: SellerType | string;
  phone?: string | null;
  availableBalance: number; // earned and ready to pay out
  pendingBalance: number; // earned but not yet payable (order not completed, or month still open)
  totalEarned: number;
  totalPaidOut: number;
  currency: string;
  status: string;
  lastPayoutAt?: string | null;
  lastUpdated?: string | null;
}

export const SELLER_TYPE_OPTIONS: { value: '' | SellerType; label: string }[] = [
  { value: '', label: 'Farmers and suppliers' },
  { value: 'FARMER', label: 'Farmers' },
  { value: 'SUPPLIER', label: 'Suppliers' },
];

export const sellerTypeLabel = (t: string) =>
  String(t).toUpperCase() === 'FARMER'
    ? 'Farmer'
    : String(t).toUpperCase() === 'SUPPLIER'
      ? 'Supplier'
      : t || 'Unknown';
