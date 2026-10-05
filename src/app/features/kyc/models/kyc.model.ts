export type KycType = 'farmer' | 'buyer' | 'supplier' | 'inspector';
export type KycStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type KycPriority = 'normal' | 'high';
export type KycFilter = 'all' | KycType;

export interface KycDocument {
  id: string;
  name: string;
  fileType: 'pdf' | 'image';
  url?: string; // real file URL from your storage. Empty in the mock.
  viewed: boolean; // the admin must open every document before approving
}

export interface KycDecision {
  status: 'approved' | 'rejected';
  at: string; // ISO date
  reason?: string; // required when rejected
}

export interface KycApplication {
  id: string; // VQ-001
  name: string;
  type: KycType;
  email: string;
  phone: string;
  county: string;
  priority: KycPriority;
  status: KycStatus;
  submittedAt: string;
  documents: KycDocument[];
  decision?: KycDecision;
}

export interface KycResult {
  ok: boolean;
  message: string;
}

export const KYC_TYPE_LABEL: Record<KycType, string> = {
  farmer: 'Farmer',
  buyer: 'Buyer',
  supplier: 'Supplier',
  inspector: 'Inspector',
};

export const KYC_STATUS_LABEL: Record<KycStatus, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const KYC_FILTERS: { key: KycFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'farmer', label: 'Farmers' },
  { key: 'buyer', label: 'Buyers' },
  { key: 'supplier', label: 'Suppliers' },
  { key: 'inspector', label: 'Inspectors' },
];

export const isOpen = (a: KycApplication) => a.status === 'pending' || a.status === 'under_review';
export const unviewedCount = (a: KycApplication) => a.documents.filter((d) => !d.viewed).length;
