export type InspectionStatus =
  | 'unassigned'
  | 'assigned'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | string;

export interface InspectionResponse {
  id: number;
  inspectorId: number | null;
  targetType: string;
  targetId: number;
  status: InspectionStatus;
  result: string | null;
  notes: string | null;
  evidenceUrls: string[];
  inspectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionRequest {
  inspectorId: number;
  targetType: string;
  targetId: number;
  status: string;
  result?: string | null;
  notes?: string | null;
  evidenceUrls?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error?: {
    code?: string;
    details?: string;
  } | null;
}
