import { Vehicle, VehicleType } from './vehicle.model';

export type DriverStatus = 'available' | 'on-delivery' | 'offline' | 'suspended';
export type KycStatus = 'pending' | 'verified';

export const ID_TYPES = ['Ghana Card', 'Passport', 'Voter ID'] as const;
export type IdType = (typeof ID_TYPES)[number];

export const GHANA_REGIONS = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
] as const;

export interface Driver {
  id: string;
  code: string; // DA-001
  fullName: string;
  username: string;
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
  username: string;
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
