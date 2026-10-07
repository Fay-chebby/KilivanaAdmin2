export type FarmerStatus = 'verified' | 'pending' | 'suspended' | 'rejected' | 'inactive';
export type FarmerAction = 'approve' | 'reject' | 'suspend' | 'reinstate';
export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

/* ---------- API shapes (from the OpenAPI document) ---------- */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error?: { code: string; details: string } | null;
}

export interface ApiCrop {
  id: number;
  farmId?: number;
  cropType?: { id: number; name: string; category: string } | null;
  variety?: string;
  areaAcres?: number;
  status?: string;
  plantingDate?: string;
  expectedHarvestDate?: string;
  expectedYieldKg?: number;
}

export interface ApiFarm {
  id: number;
  farmerId?: number;
  name: string;
  county?: string;
  subCounty?: string;
  address?: string;
  sizeAcres?: number;
  ownershipType?: string;
  status?: string;
  description?: string;
  images?: { id: number; url: string; isPrimary: boolean }[];
  crops?: ApiCrop[];
}

/** FarmerResponse (admin farmers endpoints). UserResponse has the same core with status/region. */
export interface ApiFarmer {
  id: number;
  referenceCode: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  county?: string;
  region?: string;
  verificationStatus: string;
  accountStatus?: string;
  status?: string;
  createdAt: string;
  farms?: ApiFarm[];
}

export interface ApiFarmerProfile {
  id: number;
  userId: number;
  farmName: string;
  location: string;
  farmDetails: string;
  verificationInfo: string;
  images: FarmerImage[];
}

export interface ApiKycDocument {
  id: number;
  userId: number;
  documentType: string;
  url: string;
  status: string;
  rejectionReason?: string;
  uploadedAt?: string;
  createdAt?: string;
}

export interface FarmerImage {
  id: number;
  url: string;
  publicId?: string;
  sortOrder: number;
  isPrimary: boolean;
}

/* ---------- UI models ---------- */
export interface Farmer {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  region: string; // county
  status: FarmerStatus; // derived from accountStatus + verification
  accountStatus: string;
  verification: string;
  joinedAt: string;
  farmCount: number;
  crops: string[];
}

export interface FarmerCrop {
  id: number;
  name: string;
  category: string;
  variety: string;
  areaAcres: number | null;
  status: string;
  plantingDate: string | null;
  expectedHarvestDate: string | null;
  expectedYieldKg: number | null;
}

export interface FarmerFarm {
  id: number;
  name: string;
  county: string;
  subCounty: string;
  address: string;
  sizeAcres: number | null;
  ownershipType: string;
  status: string;
  description: string;
  imageUrl: string | null;
  crops: FarmerCrop[];
}

export interface FarmerProfile {
  id: number;
  farmName: string;
  location: string;
  farmDetails: string;
  verificationInfo: string;
  images: FarmerImage[];
}

export interface FarmerDocument {
  id: number;
  type: string;
  url: string;
  status: string;
  rejectionReason: string;
  uploadedAt: string;
}

export interface FarmerDetail extends Farmer {
  farms: FarmerFarm[];
  profile: FarmerProfile | null;
  documents: FarmerDocument[];
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
export function deriveStatus(
  account: string | undefined,
  verification: string | undefined,
): FarmerStatus {
  const a = (account ?? '').toUpperCase();
  const v = (verification ?? '').toUpperCase();
  if (a === 'SUSPENDED') return 'suspended';
  if (a === 'INACTIVE') return 'inactive';
  if (v === 'REJECTED') return 'rejected';
  if (v === 'VERIFIED') return 'verified';
  return 'pending';
}

export function toFarmer(u: ApiFarmer): Farmer {
  const account = u.accountStatus ?? u.status ?? '';
  const farms = u.farms ?? [];
  const crops = [
    ...new Set(
      farms.flatMap((f) => (f.crops ?? []).map((c) => c.cropType?.name ?? '').filter(Boolean)),
    ),
  ];
  return {
    id: String(u.id),
    code: u.referenceCode,
    name: u.name,
    email: u.email,
    phone: u.phone,
    username: u.username,
    region: u.county ?? u.region ?? '',
    status: deriveStatus(account, u.verificationStatus),
    accountStatus: account,
    verification: u.verificationStatus ?? '',
    joinedAt: u.createdAt,
    farmCount: farms.length,
    crops,
  };
}

export const toCrop = (c: ApiCrop): FarmerCrop => ({
  id: c.id,
  name: c.cropType?.name ?? 'Crop',
  category: c.cropType?.category ?? '',
  variety: c.variety ?? '',
  areaAcres: c.areaAcres ?? null,
  status: c.status ?? '',
  plantingDate: c.plantingDate ?? null,
  expectedHarvestDate: c.expectedHarvestDate ?? null,
  expectedYieldKg: c.expectedYieldKg ?? null,
});

export const toFarm = (f: ApiFarm): FarmerFarm => ({
  id: f.id,
  name: f.name,
  county: f.county ?? '',
  subCounty: f.subCounty ?? '',
  address: f.address ?? '',
  sizeAcres: f.sizeAcres ?? null,
  ownershipType: f.ownershipType ?? '',
  status: f.status ?? '',
  description: f.description ?? '',
  imageUrl: (f.images?.find((i) => i.isPrimary) ?? f.images?.[0])?.url ?? null,
  crops: (f.crops ?? []).map(toCrop),
});

export const toProfile = (p: ApiFarmerProfile): FarmerProfile => ({
  id: p.id,
  farmName: p.farmName,
  location: p.location,
  farmDetails: p.farmDetails,
  verificationInfo: p.verificationInfo,
  images: [...(p.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
});

export const toDocument = (d: ApiKycDocument): FarmerDocument => ({
  id: d.id,
  type: d.documentType,
  url: d.url,
  status: d.status,
  rejectionReason: d.rejectionReason ?? '',
  uploadedAt: d.uploadedAt ?? d.createdAt ?? '',
});

export const STATUS_LABEL: Record<FarmerStatus, string> = {
  verified: 'Verified',
  pending: 'Pending',
  suspended: 'Suspended',
  rejected: 'Rejected',
  inactive: 'Inactive',
};
export const statusTone = (s: FarmerStatus): Tone =>
  (
    ({
      verified: 'green',
      pending: 'amber',
      suspended: 'red',
      rejected: 'red',
      inactive: 'gray',
    }) as const
  )[s];

export const DOC_LABEL: Record<string, string> = {
  NATIONAL_ID: 'National ID',
  KRA_PIN: 'KRA PIN',
  LAND_TITLE: 'Land title',
  LEASE_AGREEMENT: 'Lease agreement',
  FARM_PHOTO: 'Farm photo',
};
export const docTone = (s: string): Tone => {
  const v = (s ?? '').toUpperCase();
  return v === 'APPROVED' ? 'green' : v === 'REJECTED' ? 'red' : 'amber';
};
export const cropTone = (s: string): Tone => {
  const v = (s ?? '').toUpperCase();
  return v === 'GROWING' ? 'green' : v === 'HARVESTED' ? 'blue' : v === 'FAILED' ? 'red' : 'amber';
};
export const titleCase = (s: string) =>
  (s ?? '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

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

/** The 47 counties of Kenya. Used when GET /regions fails or returns nothing. */
export const KENYA_COUNTIES: string[] = [
  'Baringo',
  'Bomet',
  'Bungoma',
  'Busia',
  'Elgeyo-Marakwet',
  'Embu',
  'Garissa',
  'Homa Bay',
  'Isiolo',
  'Kajiado',
  'Kakamega',
  'Kericho',
  'Kiambu',
  'Kilifi',
  'Kirinyaga',
  'Kisii',
  'Kisumu',
  'Kitui',
  'Kwale',
  'Laikipia',
  'Lamu',
  'Machakos',
  'Makueni',
  'Mandera',
  'Marsabit',
  'Meru',
  'Migori',
  'Mombasa',
  "Murang'a",
  'Nairobi',
  'Nakuru',
  'Nandi',
  'Narok',
  'Nyamira',
  'Nyandarua',
  'Nyeri',
  'Samburu',
  'Siaya',
  'Taita-Taveta',
  'Tana River',
  'Tharaka-Nithi',
  'Trans-Nzoia',
  'Turkana',
  'Uasin Gishu',
  'Vihiga',
  'Wajir',
  'West Pokot',
];
