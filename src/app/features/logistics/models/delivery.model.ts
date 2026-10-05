export type DeliveryStatus = 'assigned' | 'in_transit' | 'arrived' | 'delivered' | 'failed';
export type CodeKind = 'pickup' | 'delivery';
export type EventKey =
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'failed'
  | 'reassigned'
  | 'code_reset'
  | 'code_locked';

export const MAX_CODE_ATTEMPTS = 3;

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface DeliveryCode {
  value: string; // 6 digits. In production the server stores only a hash.
  expiresAt: string; // ISO date
  attempts: number; // wrong attempts so far
  used: boolean; // each code works once
  locked: boolean; // locked after MAX_CODE_ATTEMPTS wrong attempts
}

export interface DeliveryEvent {
  key: EventKey;
  label: string;
  at: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
}

export interface Delivery {
  id: string;
  orderId: string; // must match an order id in OrderService
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  farmName: string;
  pickupAddress: string;
  origin: GeoPoint; // farm
  destination: GeoPoint; // buyer
  driver: Driver;
  status: DeliveryStatus;
  progress: number; // 0..1 along origin -> destination
  position: GeoPoint; // current driver position
  etaTotalMin: number; // full trip time, used to compute the live ETA
  etaMin: number;
  pickupCode: DeliveryCode; // held by the seller/farm
  deliveryCode: DeliveryCode; // held by the buyer
  events: DeliveryEvent[];
  failureReason?: string;
  proof?: { at: string; position: GeoPoint; method: 'delivery_code' };
}

export interface VerifyResult {
  ok: boolean;
  message: string;
}

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  assigned: 'Awaiting Pickup',
  in_transit: 'In Transit',
  arrived: 'Arrived',
  delivered: 'Delivered',
  failed: 'Failed',
};

/** Date shown in the ETA column: expected arrival, or the delivery date once delivered. */
export function etaDate(d: Delivery): Date | null {
  if (d.status === 'delivered') return d.proof ? new Date(d.proof.at) : null;
  if (d.status === 'failed') return null;
  return new Date(Date.now() + d.etaMin * 60_000);
}

export function codeState(c: DeliveryCode): string {
  if (c.used) return 'Used';
  if (c.locked) return 'Locked';
  if (Date.parse(c.expiresAt) < Date.now()) return 'Expired';
  return c.attempts ? `Active, ${c.attempts} wrong attempt(s)` : 'Active';
}
