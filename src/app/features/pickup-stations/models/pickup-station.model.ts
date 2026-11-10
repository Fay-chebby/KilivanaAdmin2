/* --------------------------------
   Pickup Station Request
--------------------------------- */

export interface PickupStationRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  region: string;
  isAvailable?: boolean;
  openingHours?: string;
  contactPhone?: string;
  pickupInstructions?: string;
}

/* --------------------------------
   Pickup Station Response
--------------------------------- */

export interface PickupStation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  region: string;
  isAvailable: boolean;
  openingHours: string | null;
  contactPhone: string | null;
  pickupInstructions: string | null;
  createdAt: string;
  updatedAt: string;
}

/* --------------------------------
   API Response Envelope
--------------------------------- */

export interface PickupStationApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error?: {
    code: string;
    details: string;
  } | null;
}
