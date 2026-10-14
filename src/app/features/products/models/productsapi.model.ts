/** Shapes copied from the Kilivana backend API (OpenAPI 1.0.0, updated with the admin product routes). */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  error?: { code: string; details: string } | null;
}

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  pageable?: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
    sort?: {
      sorted: boolean;
      empty: boolean;
      unsorted: boolean;
    };
  };
  sort?: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
}

export interface ProductImageDto {
  id: number;
  url: string;
  publicId?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  createdAt?: string;
}

export interface ProductDto {
  id: number;
  sellerId: number;
  sellerType: string; // farmer | supplier
  categoryId: number | null;
  name: string;
  description: string;
  unit: string;
  price: number;
  stockQty: number;
  reservedQty: number;
  soldQty: number;
  minimumOrderQty: number;
  status: string; // active | pending | rejected | suspended
  qualityGrade?: string | null; // GRADE_A | GRADE_B | GRADE_C | EXPORT | ORGANIC
  harvestDate?: string | null;
  lowStockThreshold?: number | null;
  farmId?: number | null;
  statusReason?: string | null;
  statusChangedAt?: string | null;
  statusChangedBy?: number | null;
  verifiedAt?: string | null;
  verifiedBy?: number | null;
  verifiedQty?: number | null;
  lastInspectionId?: number | null;
  createdAt: string;
  updatedAt: string;
  images?: ProductImageDto[];
  sellerName?: string | null;
  sellerPhone?: string | null;
  sellerCounty?: string | null;
  categoryName?: string | null;
  farmName?: string | null;
  farmCertified?: boolean | null;
  isLive?: boolean | null;
}

export interface ProductRequestDto {
  sellerId: number;
  sellerType: 'farmer' | 'supplier';
  categoryId: number | null;
  name: string;
  description: string;
  unit: string;
  price: number;
  stockQty: number;
  minimumOrderQty: number;
  qualityGrade?: string;
  harvestDate?: string | null;
  lowStockThreshold?: number;
  farmId?: number | null;
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  username?: string;
  referenceCode?: string;
  region?: string;
  role: string;
  status: string;
  verificationStatus?: string;
  createdAt?: string;
}

export interface CategoryDto {
  id: number;
  name: string;
  type: string;
  active: boolean;
}
export interface FarmDto {
  id: number;
  name: string;
  county?: string;
  farmerId?: number;
}
export interface ImageDto {
  id: number;
  url: string;
  publicId?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  createdAt?: string;
}

export interface InspectionDto {
  id: number;
  inspectorId: number;
  targetType: string;
  targetId: number;
  status: string; // ASSIGNED | PENDING | IN_PROGRESS | COMPLETED | CANCELLED
  result?: string | null; // APPROVED | REJECTED | CHANGES_REQUIRED
  notes?: string | null;
  evidenceUrls?: string | null;
  inspectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InspectionRequestDto {
  inspectorId: number;
  targetType: string;
  targetId: number;
  status: string;
  result?: string;
  notes?: string;
  evidenceUrls?: string;
}
