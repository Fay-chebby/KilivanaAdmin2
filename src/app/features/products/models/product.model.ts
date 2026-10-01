export type ProductStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export type VerificationStatus = 'unassigned' | 'assigned' | 'in_review' | 'approved' | 'rejected';
export type Grade = 'Grade A' | 'Grade B' | 'Grade C' | 'Export' | 'Organic';
export type Unit = 'kg' | 'bag' | 'crate' | 'litre' | 'tray' | 'bunch' | 'piece';
export type SellerType = 'farmer' | 'supplier';
export type Tone = 'green' | 'amber' | 'red' | 'grey' | 'blue';

export const CATEGORIES = [
  'Cereals & Grains',
  'Fruits',
  'Vegetables',
  'Coffee & Tea',
  'Legumes & Pulses',
  'Nuts & Seeds',
  'Roots & Tubers',
  'Dairy & Eggs',
  'Flowers',
];
export const GRADES: Grade[] = ['Grade A', 'Grade B', 'Grade C', 'Export', 'Organic'];
export const UNITS: { value: Unit; label: string }[] = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'bag', label: 'Bag' },
  { value: 'crate', label: 'Crate' },
  { value: 'litre', label: 'Litre' },
  { value: 'tray', label: 'Tray' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'piece', label: 'Piece' },
];

export const PRODUCT_STATUS_META: Record<ProductStatus, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'green' },
  pending: { label: 'Pending verification', tone: 'amber' },
  rejected: { label: 'Rejected', tone: 'red' },
  suspended: { label: 'Suspended', tone: 'grey' },
};

/** step: 1 submitted -> 2 assigned -> 3 on-site check -> 4 decided */
export const VERIFY_META: Record<VerificationStatus, { label: string; tone: Tone; step: number }> =
  {
    unassigned: { label: 'Needs verifier', tone: 'amber', step: 1 },
    assigned: { label: 'Verifier assigned', tone: 'blue', step: 2 },
    in_review: { label: 'On-site check', tone: 'blue', step: 3 },
    approved: { label: 'Verified', tone: 'green', step: 4 },
    rejected: { label: 'Failed', tone: 'red', step: 4 },
  };

export interface ProductImage {
  id: string;
  url: string;
  caption: string;
  uploadedBy: 'farmer' | 'inspector'; // 'farmer' = the seller (farmer or supplier)
  uploadedAt: string;
}

export interface ChecklistItem {
  key: string;
  label: string;
  checked: boolean;
}

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { key: 'exists', label: "Product physically exists at the seller's location", checked: false },
  { key: 'qty', label: 'Quantity on hand matches the stock listed', checked: false },
  { key: 'quality', label: 'Quality matches the grade claimed', checked: false },
  { key: 'photos', label: 'Listing photos show the real product', checked: false },
  { key: 'seller', label: 'Seller identity confirmed', checked: false },
];

export interface ProductVerification {
  status: VerificationStatus;
  inspectorId: string | null;
  inspectorName: string | null;
  assignedAt: string | null;
  dueDate: string | null;
  notes: string;
  checklist: ChecklistItem[];
  verifiedQty: number | null;
  decidedAt: string | null;
}

export interface Product {
  id: string;
  code: string; // P-001
  name: string;
  category: string;
  description: string;
  sellerName: string;
  sellerType: SellerType;
  sellerPhone: string;
  county: string;
  farmId: string | null;
  priceKes: number; // price per unit, in Kenyan shillings
  unit: Unit;
  stock: number;
  minOrder: number;
  lowStockAt: number;
  quality: Grade;
  harvestDate: string;
  status: ProductStatus;
  suspendReason?: string;
  images: ProductImage[];
  verification: ProductVerification;
  verifiedAt: string | null;
  createdAt: string;
}

export interface ProductPayload {
  name: string;
  category: string;
  description: string;
  sellerName: string;
  sellerType: SellerType;
  sellerPhone: string;
  county: string;
  farmId: string | null;
  priceKes: number;
  unit: Unit;
  stock: number;
  minOrder: number;
  lowStockAt: number;
  quality: Grade;
  harvestDate: string;
  sellerImages: ProductImage[];
}

/** Can customers see and buy this product right now? */
export function visibility(p: Product): { live: boolean; reason: string } {
  if (p.status === 'pending') return { live: false, reason: 'Waiting for on-site verification' };
  if (p.status === 'rejected') return { live: false, reason: 'Failed verification' };
  if (p.status === 'suspended') return { live: false, reason: 'Suspended by an admin' };
  if (p.stock <= 0) return { live: false, reason: 'Out of stock' };
  return { live: true, reason: 'Visible to customers' };
}

export function stockState(p: Product): 'out' | 'low' | 'ok' {
  return p.stock <= 0 ? 'out' : p.stock <= p.lowStockAt ? 'low' : 'ok';
}

export const coverOf = (p: Product) => p.images[0]?.url ?? '';
