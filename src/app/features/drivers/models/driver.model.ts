import { Vehicle, VehicleType } from './vehicle.model';

export type DriverStatus = 'available' | 'on-delivery' | 'offline' | 'suspended';
export type KycStatus = 'pending' | 'verified';

export const ID_TYPES = ['National ID', 'Passport', 'Alien ID'] as const;
export type IdType = (typeof ID_TYPES)[number];

export const KENYA_COUNTIES = [
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
  'Trans Nzoia',
  'Turkana',
  'Uasin Gishu',
  'Vihiga',
  'Wajir',
  'West Pokot',
] as const;

export interface Driver {
  id: number;
  code: string; // DA-001
  fullName: string;
  username: string;
  profileId: number;
  phone: string;
  email: string;
  region: string;
  address: string;
  status: DriverStatus;
  suspensionReason: string | null;
  // KYC
  idType: IdType;
  idNumber: string;
  licenceNumber: string;
  licenceExpiry: string; // YYYY-MM-DD
  kycStatus: KycStatus;
  // Vehicle
  vehicle: Vehicle;
  // Stats
  activeDelivery: string | null; // e.g. ORD-2847
  totalDeliveries: number;
  rating: number | null;
  createdAt: string;
}

/** What the form sends back (flat) */
export interface DriverFormValue {
  fullName: string;
  // username: string;
  /** Sent to the API only. Never stored. Empty on edit = keep current password. */
  password: string;
  phone: string;
  email: string;
  region: string;
  address: string;
  idType: IdType;
  idNumber: string;
  licenceNumber: string;
  licenceExpiry: string;
  kycStatus: KycStatus;
  vehicleType: VehicleType;
  vehicleCapacity: string;
  plateNumber: string;
  vehicleMake: string;
}
