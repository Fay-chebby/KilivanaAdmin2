import { KENYA_COUNTIES } from '../../../shared/utils/kenya-counties';

export type InspectorStatus = 'active' | 'suspended' | 'on_leave';

export type BackendUserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export type InspectionStatus = 'ASSIGNED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type InspectionResult = 'APPROVED' | 'REJECTED' | 'CHANGES_REQUIRED' | null;

/* =========================================================
   API
========================================================= */

export interface ApiError {
  code: string;
  details: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error: ApiError | null;
}

/* =========================================================
   USER
========================================================= */

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  username?: string | null;
  referenceCode?: string | null;
  region?: string | null;
  role: string;
  status: BackendUserStatus | string;
  verificationStatus?: string | null;
  createdAt: string;
}

export interface UserRegistrationRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  username?: string;
  region?: string;
}

/* =========================================================
   INSPECTOR IMAGE
========================================================= */

export interface InspectorImage {
  id: number;
  url: string;
  publicId: string;
  assetId: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================
   INSPECTOR PROFILE
========================================================= */

export interface InspectorProfileRequest {
  inspectorDetails: string;
  specialization: string;
  assignedArea: string;
  status: string;
}

export interface InspectorProfileResponse {
  id: number;
  userId: number;
  inspectorDetails: string;
  specialization: string;
  assignedArea: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  images: InspectorImage[];
}

/* =========================================================
   INSPECTOR
========================================================= */

export interface Inspector {
  id: number;

  code: string;

  name: string;
  email: string;
  phone: string;
  username?: string;

  specialization: string;
  region: string;
  assignedArea: string;
  inspectorDetails: string;

  status: InspectorStatus;

  suspendReason?: string;

  pending: number;
  completed: number;
  passRate: number;
  rating: number;

  createdAt: string;

  mustChangePassword: boolean;

  images: InspectorImage[];

  verificationStatus?: string | null;
}

/* =========================================================
   CREATE / UPDATE
========================================================= */

export interface InspectorPayload {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  region: string;
  assignedArea: string;
  inspectorDetails: string;
  status: InspectorStatus;
}

export interface InspectorCreatePayload extends InspectorPayload {
  temporaryPassword: string;
}

/* =========================================================
   INSPECTION
========================================================= */

export interface InspectionRequest {
  inspectorId: number;
  targetType: string;
  targetId: number;
  status: InspectionStatus;
  result?: string | null;
  notes?: string | null;
  evidenceUrls?: string[];
}

export interface InspectionResponse {
  id: number;
  inspectorId: number;
  targetType: string;
  targetId: number;
  status: InspectionStatus | string;
  result: InspectionResult | string | null;
  notes: string | null;
  evidenceUrls: string[];
  inspectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/* =========================================================
   FARM
========================================================= */

export interface FarmResponse {
  id: number;
  referenceCode: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  county: string;
  verificationStatus: string;
  accountStatus: string;
  createdAt: string;
  farms: unknown[];
}

/* =========================================================
   FRONTEND ASSIGNMENT
========================================================= */

export interface FarmPhoto {
  id: string;
  url: string;
  caption: string;
  takenAt: string;
}

export interface FarmAssignment {
  id: string;
  inspectionId: number;

  inspectorId: number;

  farmerName: string;
  farmName: string;
  location: string;
  crop: string;
  sizeAcres: number;

  dueDate: string;

  status: VerificationStatus;

  inspectionStatus: InspectionStatus | string;

  result: InspectionResult | string | null;

  notes: string;

  photos: FarmPhoto[];

  targetType: string;
  targetId: number;
}

/* =========================================================
   CONSTANTS
========================================================= */

export const SPECIALIZATIONS = [
  'Tea & Coffee',
  'Grains & Cereals',
  'Vegetables & Horticulture',
  'Root Crops',
  'Livestock',
];

export const REGIONS = KENYA_COUNTIES;
