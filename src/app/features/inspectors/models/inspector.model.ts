export type InspectorStatus = 'active' | 'suspended' | 'on_leave';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type IdType = 'ghana_card' | 'passport' | 'drivers_license' | 'voters_id';

export interface InspectorKyc {
  idType: IdType;
  idNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  address: string;
  emergencyName: string;
  emergencyPhone: string;
  photoUrl: string; // passport-style photo (data URL now, file URL from API later)
  idFrontUrl: string;
  idBackUrl: string;
  verifiedAt: string | null; // set when the admin confirms they saw the original ID
}

export const ID_TYPES: { value: IdType; label: string }[] = [
  { value: 'ghana_card', label: 'Ghana Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's licence" },
  { value: 'voters_id', label: "Voter's ID" },
];

export const SEED_KYC: InspectorKyc = {
  idType: 'ghana_card',
  idNumber: 'GHA-000000000-0',
  dateOfBirth: '1990-01-01',
  gender: 'male',
  address: 'Accra, Ghana',
  emergencyName: 'Next of kin',
  emergencyPhone: '0200000000',
  photoUrl: '',
  idFrontUrl: '',
  idBackUrl: '',
  verifiedAt: '2025-01-10',
};

export interface Inspector {
  id: string;
  code: string; // I-001
  name: string;
  email: string;
  phone: string;
  specialization: string;
  region: string;
  status: InspectorStatus;
  suspendReason?: string;
  pending: number;
  completed: number;
  passRate: number; // 0-100
  rating: number; // 0-5
  createdAt: string;
  mustChangePassword: boolean;
  kyc: InspectorKyc;
}

export type InspectorPayload = Pick<
  Inspector,
  'name' | 'email' | 'phone' | 'specialization' | 'region' | 'status'
> & {
  kyc: Omit<InspectorKyc, 'verifiedAt'>;
  /** admin confirms they sighted the original ID at the office */
  idSighted: boolean;
};

/** Login details are only set on creation. The email is the login username. */
export type InspectorCreatePayload = InspectorPayload & { temporaryPassword: string };

export interface FarmPhoto {
  id: string;
  url: string; // data URL now; swap for the uploaded file URL from your API
  caption: string;
  takenAt: string;
}

export interface FarmAssignment {
  id: string;
  inspectorId: string;
  farmerName: string;
  farmName: string;
  location: string;
  crop: string;
  sizeAcres: number;
  dueDate: string;
  status: VerificationStatus;
  notes: string;
  photos: FarmPhoto[];
}

export const SPECIALIZATIONS = [
  'Cocoa & Tree Crops',
  'Grains & Cereals',
  'Vegetables & Horticulture',
  'Root Crops',
  'Livestock',
];

export const REGIONS = [
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
  'Murang’a',
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
  'Trans Nzoia',
  'Turkana',
  'Uasin Gishu',
  'Vihiga',
  'Wajir',
  'West Pokot',
];
