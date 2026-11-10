export type SupplierStatus = 'active' | 'suspended' | 'pending';

export const SUPPLIER_CATEGORIES = [
  'Fertilizers & Seeds',
  'Equipment & Machinery',
  'Pesticides',
  'Seeds',
  'Irrigation',
  'Packaging',
  'Other',
] as const;

export type SupplierCategory = (typeof SUPPLIER_CATEGORIES)[number];

/** Supplier warehouse information */
export interface SupplierWarehouse {
  id: number;
  name: string;
  address: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  contactName: string | null;
  contactPhone: string | null;
  operatingHours: string | null;
  active: boolean;
  defaultLocation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  profileId: number | null;
  code: string;
  name: string;
  username: string;
  category: SupplierCategory;
  contactPerson: string;
  email: string;
  phone: string;
  region: string;
  address: string;
  contractEnd: string | null;
  status: SupplierStatus;
  suspensionReason: string | null;
  productsCount: number;
  rating: number | null;
  createdAt: string;
  warehouses: SupplierWarehouse[];
}

/** What the supplier form sends */
export interface SupplierFormValue {
  name: string;
  username: string;
  password: string;
  category: SupplierCategory;
  contactPerson: string;
  email: string;
  phone: string;
  region: string;
  address: string;
  contractEnd: string;
  status: SupplierStatus;
}

/** Raw record from the admin supplier API */
export interface AdminSupplierDto {
  userId: number;
  profileId?: number | null;
  code?: string | null;
  companyName?: string | null;
  contactPerson?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  region?: string | null;
  address?: string | null;
  category?: string | null;
  contractEndDate?: string | null;
  status?: string | null;
  suspensionReason?: string | null;
  productsCount?: number | null;
  rating?: number | null;
  createdAt?: string | null;
  warehouses?: SupplierWarehouse[] | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
  error?: {
    code?: string;
    details?: string;
  } | null;
}

export interface SupplierProduct {
  id: number;
  sellerId: number;
  sellerType: string;
  categoryId: number;
  name: string;
  description: string | null;
  unit: string;
  price: number;
  stockQty: number;
  reservedQty: number;
  soldQty: number;
  minimumOrderQty: number;
  status: string;
  qualityGrade: string | null;
  farmId: number | null;
  farmName: string | null;
  categoryName: string | null;
  isLive: boolean;
  createdAt: string;
  updatedAt: string;
}