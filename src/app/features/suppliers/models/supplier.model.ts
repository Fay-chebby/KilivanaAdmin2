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
  id: string;
  code: string; // e.g. S-001
  name: string;
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
  category: SupplierCategory;
  contactPerson: string;
  email: string;
  phone: string;
  region: string;
  address: string;
  contractEnd: string;
  status: SupplierStatus;
}
