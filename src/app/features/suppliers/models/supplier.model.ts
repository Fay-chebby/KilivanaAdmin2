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

export interface Supplier {
  /** The supplier's user id. All /admin/suppliers/{userId} calls use this. */
  id: number;
  profileId: number | null;
  code: string; // e.g. S-001
  name: string;
  username: string;
  category: SupplierCategory;
  contactPerson: string;
  email: string;
  phone: string;
  region: string;
  address: string;
  contractEnd: string | null; // YYYY-MM-DD
  status: SupplierStatus;
  suspensionReason: string | null;
  productsCount: number;
  rating: number | null;
  createdAt: string;
}

/** What the form sends back */
export interface SupplierFormValue {
  name: string;
  username: string;
  /** Sent to the API only. Never stored on the Supplier object. Empty on edit = keep current password. */
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

/** Raw record from /api/v1/admin/suppliers */
export interface AdminSupplierDto {
  userId: number;
  profileId?: number | null;
  code?: string | null;
  companyName: string;
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
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: { code?: string; details?: string } | null;
}
