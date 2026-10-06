export type FarmerStatus = 'verified' | 'pending' | 'suspended' | 'rejected';
export type FarmerAction = 'approve' | 'reject' | 'suspend' | 'reinstate';
export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

/* ---------- API shapes (from your Swagger examples) ---------- */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error?: { code: string; details: string } | null;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  username: string;
  referenceCode: string;
  region: string;
  role: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
}

export interface ApiFarmerProfile {
  id: number;
  userId: number;
  farmName: string;
  location: string;
  farmDetails: string;
  verificationInfo: string;
  createdAt: string;
  updatedAt: string;
  images: FarmerImage[];
}

export interface FarmerImage {
  id: number;
  url: string;
  publicId: string;
  assetId: string;
  sortOrder: number;
  isPrimary: boolean;
}

/* ---------- UI models ---------- */
export interface Farmer {
  id: string;
  code: string; // referenceCode
  name: string;
  email: string;
  phone: string;
  username: string;
  region: string;
  status: FarmerStatus; // derived from API status + verificationStatus
  accountStatus: string; // raw API status
  verification: string; // raw API verificationStatus
  joinedAt: string;
}

export interface FarmerProfile {
  id: number;
  farmName: string;
  location: string;
  farmDetails: string;
  verificationInfo: string;
  images: FarmerImage[];
}

export interface FarmerDetail extends Farmer {
  profile: FarmerProfile | null;
}

export interface FarmerStats {
  total: number;
  verified: number;
  pending: number;
  suspended: number;
}
export interface FarmerFilterValue {
  search: string;
  region: string;
  status: '' | FarmerStatus;
}

export interface FarmerFormValue {
  name: string;
  email: string;
  phone: string;
  username: string; // create only
  password: string; // create only
  region: string;
  farmName: string;
  location: string;
  farmDetails: string;
}

/* ---------- mapping ---------- */
const BLOCKED = new Set(['SUSPENDED', 'INACTIVE', 'BLOCKED', 'DISABLED', 'DEACTIVATED']);

export function toFarmer(u: ApiUser): Farmer {
  const account = (u.status ?? '').toUpperCase();
  const ver = (u.verificationStatus ?? '').toUpperCase();
  const status: FarmerStatus = BLOCKED.has(account)
    ? 'suspended'
    : ver === 'REJECTED'
      ? 'rejected'
      : ver === 'VERIFIED' || ver === 'APPROVED'
        ? 'verified'
        : 'pending';
  return {
    id: String(u.id),
    code: u.referenceCode,
    name: u.name,
    email: u.email,
    phone: u.phone,
    username: u.username,
    region: u.region,
    status,
    accountStatus: u.status,
    verification: u.verificationStatus,
    joinedAt: u.createdAt,
  };
}

export const toProfile = (p: ApiFarmerProfile): FarmerProfile => ({
  id: p.id,
  farmName: p.farmName,
  location: p.location,
  farmDetails: p.farmDetails,
  verificationInfo: p.verificationInfo,
  images: [...(p.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
});

export const STATUS_LABEL: Record<FarmerStatus, string> = {
  verified: 'Verified',
  pending: 'Pending',
  suspended: 'Suspended',
  rejected: 'Rejected',
};
export const statusTone = (s: FarmerStatus): Tone =>
  (({ verified: 'green', pending: 'amber', suspended: 'red', rejected: 'red' }) as const)[s];

export const initials = (name: string) =>
  (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

const COLORS = ['#0f9d58', '#e11d48', '#16a34a', '#ea7c1a', '#7c3aed', '#0891b2'];
export const avatarColor = (seed: string) => {
  let h = 0;
  for (const c of seed ?? '') h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
};
