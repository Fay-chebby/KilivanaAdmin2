export type FarmerStatus = 'verified' | 'pending' | 'suspended' | 'rejected' | 'inactive';

export type FarmerAction = 'approve' | 'reject' | 'suspend' | 'reinstate';

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

/* =========================================================
   API SHAPES
   ========================================================= */

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error?: {
    code: string;
    details: string;
  } | null;
}

/* ---------- Crop ---------- */

export interface ApiCrop {
  id: number;
  farmId?: number;

  cropType?: {
    id: number;
    name: string;
    category: string;
  } | null;

  variety?: string;
  areaAcres?: number;
  status?: string;
  plantingDate?: string;
  expectedHarvestDate?: string;
  expectedYieldKg?: number;
}

/* ---------- Farm ---------- */

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

  images?: ApiFarmImage[];

  crops?: ApiCrop[];
}

export interface ApiFarmImage {
  id: number;
  url: string;
  isPrimary: boolean;
}

/* ---------- Farmer ---------- */

/**
 * FarmerResponse from:
 * GET /api/v1/admin/farmers
 * GET /api/v1/admin/farmers/{id}
 */
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

/* =========================================================
   FARMER PROFILE
   ========================================================= */

/**
 * Response from:
 *
 * GET /api/v1/profiles/farmers/{userId}
 *
 * This contains farmer profile information.
 *
 * Images are intentionally NOT included here because
 * images have their own endpoint:
 *
 * GET /api/v1/profiles/farmers/{userId}/images
 */
export interface ApiFarmerProfile {
  id: number;
  userId: number;

  farmName: string;
  location: string;
  farmDetails: string;
  verificationInfo: string;
}

/* =========================================================
   FARMER PROFILE IMAGES
   ========================================================= */

/**
 * Response item from:
 *
 * GET /api/v1/profiles/farmers/{userId}/images
 *
 * These are images uploaded through the farmer profile.
 *
 * They are NOT KYC documents.
 */
export interface ApiFarmerImage {
  id: number;
  url: string;
  publicId?: string;
  sortOrder: number;
  isPrimary: boolean;
}

/* =========================================================
   KYC DOCUMENTS
   ========================================================= */

/**
 * Response item from:
 *
 * GET /api/v1/admin/kyc
 * GET /api/v1/admin/kyc/pending
 *
 * These are verification documents.
 *
 * Examples:
 * - National ID
 * - KRA PIN
 * - Land title
 * - Lease agreement
 */
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

/* =========================================================
   UI MODELS
   ========================================================= */

/* ---------- Farmer ---------- */

export interface Farmer {
  id: string;

  code: string;

  name: string;
  email: string;
  phone: string;
  username: string;

  /**
   * County.
   */
  region: string;

  /**
   * Derived from accountStatus + verificationStatus.
   */
  status: FarmerStatus;

  accountStatus: string;

  verification: string;

  joinedAt: string;

  farmCount: number;

  crops: string[];
}

/* ---------- Crop ---------- */

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

/* ---------- Farm ---------- */

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

/* =========================================================
   FARMER PROFILE
   ========================================================= */

/**
 * Farmer profile information.
 *
 * Does NOT contain KYC documents.
 *
 * Does NOT contain profile images.
 *
 * Profile images are stored separately in:
 * FarmerDetail.profileImages
 */
export interface FarmerProfile {
  id: number;

  farmName: string;

  location: string;

  farmDetails: string;

  verificationInfo: string;
}

/* =========================================================
   FARMER PROFILE IMAGES
   ========================================================= */

/**
 * Farmer images uploaded through:
 *
 * POST /api/v1/profiles/farmers/{userId}/images
 *
 * These are normal profile/farm images.
 */
export interface FarmerProfileImage {
  id: number;

  url: string;

  publicId?: string;

  sortOrder: number;

  isPrimary: boolean;
}

/* =========================================================
   KYC DOCUMENT
   ========================================================= */

/**
 * KYC document displayed in the admin farmer details page.
 *
 * This is separate from FarmerProfileImage.
 */
export interface FarmerDocument {
  id: number;

  /**
   * Example:
   * NATIONAL_ID
   * KRA_PIN
   * LAND_TITLE
   */
  type: string;

  url: string;

  /**
   * Example:
   * PENDING
   * APPROVED
   * REJECTED
   */
  status: string;

  rejectionReason: string;

  uploadedAt: string;
}

/* =========================================================
   FARMER DETAIL
   ========================================================= */

export interface FarmerDetail extends Farmer {
  farms: FarmerFarm[];

  /**
   * Farmer profile information.
   */
  profile: FarmerProfile | null;

  /**
   * KYC verification documents.
   *
   * Source:
   * GET /api/v1/admin/kyc
   */
  documents: FarmerDocument[];

  /**
   * Farmer profile images.
   *
   * Source:
   * GET /api/v1/profiles/farmers/{userId}/images
   */
  profileImages: FarmerProfileImage[];
}

/* =========================================================
   FARMER STATS
   ========================================================= */

export interface FarmerStats {
  total: number;

  verified: number;

  pending: number;

  suspended: number;
}

/* =========================================================
   FILTERS
   ========================================================= */

export interface FarmerFilterValue {
  search: string;

  region: string;

  status: '' | FarmerStatus;
}

/* =========================================================
   FARMER FORM
   ========================================================= */

export interface FarmerFormValue {
  name: string;

  email: string;

  phone: string;

  /**
   * Create only.
   */
  username: string;

  /**
   * Create only.
   */
  password: string;

  /**
   * County.
   */
  region: string;

  farmName: string;

  location: string;

  farmDetails: string;
  farmImages: File[];
  documents: File[];
}

/* =========================================================
   STATUS MAPPING
   ========================================================= */

export function deriveStatus(
  account: string | undefined,
  verification: string | undefined,
): FarmerStatus {
  const a = (account ?? '').toUpperCase();

  const v = (verification ?? '').toUpperCase();

  if (a === 'SUSPENDED') {
    return 'suspended';
  }

  if (a === 'INACTIVE') {
    return 'inactive';
  }

  if (v === 'REJECTED') {
    return 'rejected';
  }

  if (v === 'VERIFIED') {
    return 'verified';
  }

  return 'pending';
}

/* =========================================================
   FARMER MAPPER
   ========================================================= */

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

/* =========================================================
   CROP MAPPER
   ========================================================= */

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

/* =========================================================
   FARM MAPPER
   ========================================================= */

export const toFarm = (f: ApiFarm): FarmerFarm => ({
  id: f.id,

  name: f.name ?? '',

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

/* =========================================================
   FARMER PROFILE MAPPER
   ========================================================= */

export const toProfile = (p: ApiFarmerProfile): FarmerProfile => ({
  id: p.id,

  farmName: p.farmName ?? '',

  location: p.location ?? '',

  farmDetails: p.farmDetails ?? '',

  verificationInfo: p.verificationInfo ?? '',
});

/* =========================================================
   PROFILE IMAGE MAPPER
   ========================================================= */

/**
 * Maps an image returned from:
 *
 * GET /profiles/farmers/{userId}/images
 */
export const toProfileImage = (image: ApiFarmerImage): FarmerProfileImage => ({
  id: image.id,

  url: image.url ?? '',

  publicId: image.publicId,

  sortOrder: image.sortOrder ?? 0,

  isPrimary: image.isPrimary ?? false,
});

/* =========================================================
   KYC DOCUMENT MAPPER
   ========================================================= */

export const toDocument = (d: ApiKycDocument): FarmerDocument => ({
  id: d.id,

  type: d.documentType ?? '',

  url: d.url ?? '',

  status: d.status ?? '',

  rejectionReason: d.rejectionReason ?? '',

  uploadedAt: d.uploadedAt ?? d.createdAt ?? '',
});

/* =========================================================
   STATUS LABELS
   ========================================================= */

export const STATUS_LABEL: Record<FarmerStatus, string> = {
  verified: 'Verified',

  pending: 'Pending',

  suspended: 'Suspended',

  rejected: 'Rejected',

  inactive: 'Inactive',
};

/* =========================================================
   STATUS TONE
   ========================================================= */

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

/* =========================================================
   KYC DOCUMENT LABELS
   ========================================================= */

export const DOC_LABEL: Record<string, string> = {
  NATIONAL_ID: 'National ID',

  KRA_PIN: 'KRA PIN',

  LAND_TITLE: 'Land title',

  LEASE_AGREEMENT: 'Lease agreement',

  FARM_PHOTO: 'Farm photo',
};

/* =========================================================
   KYC DOCUMENT TONE
   ========================================================= */

export const docTone = (s: string): Tone => {
  const v = (s ?? '').toUpperCase();

  return v === 'APPROVED' ? 'green' : v === 'REJECTED' ? 'red' : 'amber';
};

/* =========================================================
   CROP TONE
   ========================================================= */

export const cropTone = (s: string): Tone => {
  const v = (s ?? '').toUpperCase();

  return v === 'GROWING' ? 'green' : v === 'HARVESTED' ? 'blue' : v === 'FAILED' ? 'red' : 'amber';
};

/* =========================================================
   TITLE CASE
   ========================================================= */

export const titleCase = (s: string) =>
  (s ?? '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

/* =========================================================
   INITIALS
   ========================================================= */

export const initials = (name: string) =>
  (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

/* =========================================================
   AVATAR COLORS
   ========================================================= */

const COLORS = ['#0f9d58', '#e11d48', '#16a34a', '#ea7c1a', '#7c3aed', '#0891b2'];

export const avatarColor = (seed: string) => {
  let h = 0;

  for (const c of seed ?? '') {
    h = (h * 31 + c.charCodeAt(0)) >>> 0;
  }

  return COLORS[h % COLORS.length];
};

/* =========================================================
   KENYAN COUNTIES
   ========================================================= */

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
