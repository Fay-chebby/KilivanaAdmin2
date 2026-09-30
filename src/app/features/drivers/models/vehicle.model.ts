export const VEHICLE_TYPES = ['Truck', 'Van', 'Pickup', 'Motorbike'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export interface Vehicle {
  type: VehicleType;
  capacity: string; // e.g. "5T", "2T", "200kg"
  plateNumber: string;
  make: string;
}

export const vehicleLabel = (v: Vehicle): string => `${v.type} (${v.capacity})`;
