import { KENYA_COUNTIES } from '../../../shared/utils/kenya-counties';

export const COUNTIES = KENYA_COUNTIES;

export type FarmStatus = 'active' | 'pending' | 'suspended';

export type InspectionStatus = 'unassigned' | 'assigned' | 'in_review' | 'approved' | 'rejected';

export type Tone = 'green' | 'amber' | 'red' | 'grey' | 'blue';

/**
 * step = which stepper stage is current
 * 0 = registered
 * 1 = assign
 * 2 = visit
 * 3 = review
 * 4 = decided
 */
export const INSPECTION_META: Record<
  InspectionStatus,
  { label: string; tone: Tone; step: number }
> = {
  unassigned: {
    label: 'Needs inspector',
    tone: 'amber',
    step: 1,
  },

  assigned: {
    label: 'Inspector assigned',
    tone: 'blue',
    step: 2,
  },

  in_review: {
    label: 'On-site review',
    tone: 'blue',
    step: 3,
  },

  approved: {
    label: 'Approved',
    tone: 'green',
    step: 4,
  },

  rejected: {
    label: 'Rejected',
    tone: 'red',
    step: 4,
  },
};

export const FARM_STATUS_META: Record<FarmStatus, { label: string; tone: Tone }> = {
  active: {
    label: 'Active',
    tone: 'green',
  },

  pending: {
    label: 'Pending',
    tone: 'amber',
  },

  suspended: {
    label: 'Suspended',
    tone: 'red',
  },
};

export interface FarmImage {
  id: string;
  url: string;
  caption: string;
  uploadedBy: 'farmer' | 'inspector';
  uploadedAt: string;
}

export interface ChecklistItem {
  key: string;
  label: string;
  checked: boolean;
}

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    key: 'location',
    label: 'Farm exists at the registered location',
    checked: false,
  },
  {
    key: 'size',
    label: 'Size matches what was registered',
    checked: false,
  },
  {
    key: 'crops',
    label: 'Crops match the declaration',
    checked: false,
  },
  {
    key: 'owner',
    label: 'Owner identity confirmed on site',
    checked: false,
  },
  {
    key: 'photos',
    label: "Farmer's photos match the site",
    checked: false,
  },
];

export interface FarmInspection {
  status: InspectionStatus;
  inspectorId: string | null;
  inspectorName: string | null;
  assignedAt: string | null;
  dueDate: string | null;
  notes: string;
  checklist: ChecklistItem[];
  decidedAt: string | null;
}

export interface Farm {
  id: string;
  code: string;
  name: string;
  ownerName: string;
  ownerPhone: string;
  county: string;
  location: string;
  sizeHa: number;
  crops: string[];
  certified: boolean;
  status: FarmStatus;
  images: FarmImage[];
  inspection: FarmInspection;
  registeredAt: string;
}

export interface FarmPayload {
  name: string;
  ownerName: string;
  ownerPhone: string;
  county: string;
  location: string;
  sizeHa: number;
  crops: string[];
  status: FarmStatus;
  farmerImages: FarmImage[];
}

export const CROPS = [
  'Tea',
  'Coffee',
  'Maize',
  'Beans',
  'Wheat',
  'Sorghum',
  'Millet',
  'Rice',
  'Sugarcane',
  'Avocado',
  'Macadamia',
  'Mango',
  'Bananas',
  'Cassava',
  'Sweet Potato',
  'Irish Potato',
  'Tomatoes',
  'Kale',
  'Cabbage',
  'French Beans',
  'Cowpeas',
  'Cotton',
  'Cut Flowers',
];

export const coverOf = (f: Farm) => f.images[0]?.url ?? '';
