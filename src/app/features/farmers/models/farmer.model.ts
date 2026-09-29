export type FarmerStatus = 'verified' | 'pending' | 'suspended' | 'rejected';
export type KycStatus = 'approved' | 'pending' | 'under_review' | 'rejected';
export type FarmerAction = 'approve' | 'reject' | 'suspend' | 'reinstate';
export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

export interface Farmer {
  id: string;
  code: string; // e.g. F-001
  name: string;
  email: string;
  phone: string;
  region: string;
  crops: string[];
  status: FarmerStatus;
  kyc: KycStatus;
  farms: number;
  rating: number | null;
  revenue: number | null;
  joinedAt: string; // ISO date
  statusReason?: string;
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
  region: string;
  crops: string[];
}

export interface FarmerOrder {
  id: string;
  product: string;
  buyer: string;
  amount: number;
  status: 'in_transit' | 'completed' | 'processing' | 'cancelled';
}

export interface FarmerFarm {
  id: string;
  name: string;
  location: string;
  hectares: number;
  crops: string[];
  status: 'active' | 'fallow';
}

export interface FarmerDocument {
  id: string;
  name: string;
  uploadedAt: string;
  status: 'approved' | 'pending' | 'rejected';
}

export interface FarmerDetail extends Farmer {
  cropPortfolio: { name: string; active: boolean }[];
  performance: {
    totalOrders: number;
    completionRate: number;
    avgResponse: string;
    disputes: number;
  };
  orders: FarmerOrder[];
  farmList: FarmerFarm[];
  documents: FarmerDocument[];
}

export const KENYA_COUNTIES = [
  'Mombasa',
  'Kwale',
  'Kilifi',
  'Tana River',
  'Lamu',
  'Taita-Taveta',
  'Garissa',
  'Wajir',
  'Mandera',
  'Marsabit',
  'Isiolo',
  'Meru',
  'Tharaka-Nithi',
  'Embu',
  'Kitui',
  'Machakos',
  'Makueni',
  'Nyandarua',
  'Nyeri',
  'Kirinyaga',
  'Murang’a',
  'Kiambu',
  'Turkana',
  'West Pokot',
  'Samburu',
  'Trans Nzoia',
  'Uasin Gishu',
  'Elgeyo-Marakwet',
  'Nandi',
  'Baringo',
  'Laikipia',
  'Nakuru',
  'Narok',
  'Kajiado',
  'Kericho',
  'Bomet',
  'Kakamega',
  'Vihiga',
  'Bungoma',
  'Busia',
  'Siaya',
  'Kisumu',
  'Homa Bay',
  'Migori',
  'Kisii',
  'Nyamira',
  'Nairobi City',
];

export const STATUS_LABEL: Record<FarmerStatus, string> = {
  verified: 'Verified',
  pending: 'Pending',
  suspended: 'Suspended',
  rejected: 'Rejected',
};
export const KYC_LABEL: Record<KycStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  under_review: 'Under Review',
  rejected: 'Rejected',
};
export const ORDER_STATUS_LABEL: Record<FarmerOrder['status'], string> = {
  in_transit: 'In Transit',
  completed: 'Completed',
  processing: 'Processing',
  cancelled: 'Cancelled',
};

export const statusTone = (s: FarmerStatus): Tone =>
  (({ verified: 'green', pending: 'amber', suspended: 'red', rejected: 'red' }) as const)[s];
export const kycTone = (s: KycStatus): Tone =>
  (({ approved: 'green', pending: 'amber', under_review: 'amber', rejected: 'red' }) as const)[s];
export const orderTone = (s: FarmerOrder['status']): Tone =>
  (({ in_transit: 'blue', completed: 'green', processing: 'amber', cancelled: 'gray' }) as const)[
    s
  ];

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

const AVATAR_COLORS = ['#0f9d58', '#e11d48', '#16a34a', '#ea7c1a', '#7c3aed', '#0891b2'];
export const avatarColor = (seed: string) => {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};
