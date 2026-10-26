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

// ---------- Backend contract (/api/v1/admin/kyc, /api/v1/admin/users) ----------
export type ApiKycDocType =
  | 'NATIONAL_ID'
  | 'KRA_PIN'
  | 'LAND_TITLE'
  | 'LEASE_AGREEMENT'
  | 'FARM_PHOTO';

export interface KycDocumentResponse {
  id: number;
  userId: number;
  documentType: ApiKycDocType;
  url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  rejectionReason?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  uploadedAt?: string;
  createdAt?: string;
}

export interface UserLite {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  region?: string;
  role?: string;
  createdAt?: string;
}

export const DOC_TYPE_LABEL: Record<ApiKycDocType, string> = {
  NATIONAL_ID: 'National ID',
  KRA_PIN: 'KRA PIN Certificate',
  LAND_TITLE: 'Land Title',
  LEASE_AGREEMENT: 'Lease Agreement',
  FARM_PHOTO: 'Farm Photo',
};

const ROLE_TO_TYPE: Record<string, KycType> = {
  FARMER: 'farmer',
  BUYER: 'buyer',
  SUPPLIER: 'supplier',
  INSPECTOR: 'inspector',
};
const HIGH_PRIORITY_DAYS = 7;

/** Turns a backend document into the viewer's shape. Relative URLs are resolved against the API origin. */
export function toKycDocument(d: KycDocumentResponse, viewed: boolean, origin = ''): KycDocument {
  const url = d.url ? (d.url.startsWith('/') ? origin + d.url : d.url) : undefined;
  const isPdf = !!url && /\.pdf($|\?)/i.test(url);
  return {
    id: String(d.id),
    name: DOC_TYPE_LABEL[d.documentType] ?? d.documentType,
    fileType: isPdf ? 'pdf' : 'image',
    url,
    viewed,
  };
}

/**
 * The backend reviews one document at a time. The admin screens review a person, so documents are
 * grouped by user. A person is Pending while any document is pending, Rejected if none are pending
 * and any was rejected, and Approved when every document was approved.
 */
export function toApplications(
  docs: KycDocumentResponse[],
  users: UserLite[],
  viewed: ReadonlySet<string>,
  origin = '',
  now = Date.now(),
): KycApplication[] {
  const byUser = new Map<number, KycDocumentResponse[]>();
  for (const d of docs) byUser.set(d.userId, [...(byUser.get(d.userId) ?? []), d]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const out: KycApplication[] = [];

  for (const [userId, list] of byUser) {
    const u = userById.get(userId);
    const st = (d: KycDocumentResponse) => String(d.status).toUpperCase();
    const anyPending = list.some((d) => st(d) === 'PENDING');
    const anyRejected = list.some((d) => st(d) === 'REJECTED');
    const documents = list.map((d) =>
      toKycDocument(d, st(d) !== 'PENDING' || viewed.has(String(d.id)), origin),
    );
    const submittedAt =
      list
        .map((d) => d.uploadedAt ?? d.createdAt ?? '')
        .filter(Boolean)
        .sort()[0] ?? new Date(now).toISOString();
    const status: KycStatus = anyPending
      ? documents.some(
          (d) => d.viewed && st(list.find((x) => String(x.id) === d.id)!) === 'PENDING',
        )
        ? 'under_review'
        : 'pending'
      : anyRejected
        ? 'rejected'
        : 'approved';
    const waitedDays = (now - Date.parse(submittedAt)) / 86_400_000;
    const reviewed = list
      .filter((d) => d.reviewedAt)
      .sort((a, b) => Date.parse(b.reviewedAt!) - Date.parse(a.reviewedAt!))[0];
    const decision: KycDecision | undefined =
      anyPending || !reviewed
        ? undefined
        : {
            status: anyRejected ? 'rejected' : 'approved',
            at: reviewed.reviewedAt!,
            reason: anyRejected
              ? list.find((d) => st(d) === 'REJECTED')?.rejectionReason
              : undefined,
          };
    out.push({
      id: String(userId),
      name: u?.name ?? `User #${userId}`,
      type: ROLE_TO_TYPE[(u?.role ?? '').toUpperCase()] ?? 'farmer',
      email: u?.email ?? '',
      phone: u?.phone ?? '',
      county: u?.region ?? '',
      priority: anyPending && waitedDays >= HIGH_PRIORITY_DAYS ? 'high' : 'normal',
      status,
      submittedAt,
      documents,
      decision,
    });
  }
  return out.sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
}
