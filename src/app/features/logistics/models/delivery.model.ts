// ---------- Backend contract (Kilivana API, /api/v1) ----------
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error: { code: string; details?: string } | null;
}

export type JobStatus =
  | 'pending_assignment'
  | 'assigned'
  | 'accepted'
  | 'en_route_to_pickup'
  | 'arrived_at_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'arrived_at_destination'
  | 'delivered'
  | 'cancelled'
  | 'failed';

export interface LogisticsJob {
  id: number;
  orderId: number;
  pickupAddress?: string;
  destinationAddress?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  cargoDescription?: string;
  quantity?: number;
  payoutAmount?: number;
  scheduledPickupAt?: string;
  scheduledDropoffAt?: string;
  distanceKm?: number;
  estimatedMinutes?: number;
  deliveryOtpExpiresAt?: string;
  deliveryOtpVerified?: boolean;
  deliveryOtpAttempts?: number;
  deliveryOtpLockedUntil?: string;
  status: JobStatus;
  driverId?: number | null;
  cancellationReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrackingEvent {
  id: number;
  logisticsJobId: number;
  status: JobStatus;
  latitude?: number;
  longitude?: number;
  note?: string;
  driverId?: number;
  recordedAt: string;
}

export interface ProofOfDeliveryDto {
  id?: number;
  logisticsJobId?: number;
  recipientName?: string;
  signatureUrl?: string;
  photoUrl?: string;
  otpReference?: string;
  deliveredAt?: string;
}

export interface DriverLocation {
  tripId: number;
  orderId?: number;
  driverId?: number;
  latitude: number;
  longitude: number;
  speedKmh?: number;
  bearing?: number;
  status?: string;
  serverTimestamp?: string;
}

export interface AdminDriver {
  userId: number;
  fullName: string;
  phone?: string;
  status: string;
  vehicleType?: string;
  vehicleMake?: string;
  plateNumber?: string;
  kycStatus?: string;
}

/** The fields of OrderResponse that logistics needs. */
export interface OrderLite {
  id: number;
  code?: string;
  buyerName?: string;
  buyerPhone?: string;
  deliveryAddress?: string;
  sellerName?: string;
}

// ---------- View model used by the pages ----------
export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'failed';
export type EventKey = 'assigned' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered' | 'failed';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface DeliveryCode {
  expiresAt?: string;
  attempts: number;
  used: boolean; // verified
  locked: boolean; // temporarily locked after too many wrong codes
}

export interface DeliveryEvent {
  key: EventKey;
  label: string;
  at: string;
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
}

export interface Delivery {
  id: string; // job id
  jobId: number;
  orderId: string; // numeric order id as text
  orderCode?: string;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  farmName: string;
  pickupAddress: string;
  origin: GeoPoint;
  destination: GeoPoint;
  driver: Driver;
  status: DeliveryStatus;
  rawStatus: JobStatus;
  progress: number; // 0..1 straight-line estimate
  position: GeoPoint; // last driver fix, or the farm before the driver moves
  hasLivePosition: boolean;
  etaTotalMin: number;
  etaMin: number;
  deliveryCode: DeliveryCode;
  events: DeliveryEvent[];
  failureReason?: string;
  proof?: { at: string; position: GeoPoint; recipientName?: string };
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  pending: 'Needs Driver',
  assigned: 'Awaiting Pickup',
  in_transit: 'In Transit',
  arrived: 'Arrived',
  delivered: 'Delivered',
  failed: 'Failed',
};

export function toUiStatus(s: JobStatus): DeliveryStatus {
  switch (s) {
    case 'pending_assignment':
      return 'pending';
    case 'assigned':
    case 'accepted':
    case 'en_route_to_pickup':
    case 'arrived_at_pickup':
      return 'assigned';
    case 'picked_up':
    case 'in_transit':
      return 'in_transit';
    case 'arrived_at_destination':
      return 'arrived';
    case 'delivered':
      return 'delivered';
    default:
      return 'failed'; // cancelled | failed
  }
}

const EVENT_KEY: Partial<Record<DeliveryStatus, EventKey>> = {
  assigned: 'assigned',
  in_transit: 'in_transit',
  arrived: 'arrived',
  delivered: 'delivered',
  failed: 'failed',
};

export function eventKeyOf(s: JobStatus): EventKey | null {
  if (s === 'picked_up') return 'picked_up';
  return EVENT_KEY[toUiStatus(s)] ?? null;
}

export const EVENT_LABEL: Record<JobStatus, string> = {
  pending_assignment: 'Waiting for a driver',
  assigned: 'Driver assigned',
  accepted: 'Driver accepted the job',
  en_route_to_pickup: 'Driver heading to the farm',
  arrived_at_pickup: 'Driver at the farm',
  picked_up: 'Picked up at farm',
  in_transit: 'On the way',
  arrived_at_destination: 'Driver arrived',
  delivered: 'Delivered. Code confirmed by buyer',
  cancelled: 'Delivery cancelled',
  failed: 'Delivery failed',
};

/** Date shown in the ETA column: expected arrival, or the delivery date once delivered. */
export function etaDate(d: Delivery): Date | null {
  if (d.status === 'delivered') return d.proof ? new Date(d.proof.at) : null;
  if (d.status === 'failed' || d.status === 'pending') return null;
  return new Date(Date.now() + d.etaMin * 60_000);
}

export function codeState(c: DeliveryCode): string {
  if (c.used) return 'Verified';
  if (c.locked) return 'Locked, too many wrong attempts';
  if (c.expiresAt && Date.parse(c.expiresAt) < Date.now()) return 'Expired';
  return c.attempts ? `Active, ${c.attempts} wrong attempt(s)` : 'Active';
}

// ---------- Mapping ----------
const NAIROBI: GeoPoint = { lat: -1.2921, lng: 36.8219 };
const pt = (lat?: number, lng?: number, fb: GeoPoint = NAIROBI): GeoPoint =>
  lat != null && lng != null ? { lat, lng } : fb;

function km(a: GeoPoint, b: GeoPoint): number {
  const r = (x: number) => (x * Math.PI) / 180,
    R = 6371;
  const h =
    Math.sin(r(b.lat - a.lat) / 2) ** 2 +
    Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function toDelivery(
  job: LogisticsJob,
  order?: OrderLite,
  driver?: AdminDriver,
  events: TrackingEvent[] = [],
  fix?: DriverLocation | null,
  pod?: ProofOfDeliveryDto | null,
): Delivery {
  const status = toUiStatus(job.status);
  const origin = pt(job.pickupLatitude, job.pickupLongitude);
  const destination = pt(job.destinationLatitude, job.destinationLongitude);
  const done = status === 'delivered';
  const position = done ? destination : fix ? { lat: fix.latitude, lng: fix.longitude } : origin;
  const total = Math.max(km(origin, destination), 0.001);
  const progress = done
    ? 1
    : fix
      ? Math.min(1, Math.max(0, 1 - km(position, destination) / total))
      : 0;
  const etaTotalMin = job.estimatedMinutes ?? 0;
  const lockedUntil = job.deliveryOtpLockedUntil ? Date.parse(job.deliveryOtpLockedUntil) : 0;

  const chrono = [...events].sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));
  const evs: DeliveryEvent[] = [];
  for (const e of chrono) {
    const key = eventKeyOf(e.status);
    if (key) evs.push({ key, label: e.note?.trim() || EVENT_LABEL[e.status], at: e.recordedAt });
  }

  return {
    id: String(job.id),
    jobId: job.id,
    orderId: String(job.orderId),
    orderCode: order?.code,
    buyerName: order?.buyerName ?? 'Buyer',
    buyerPhone: order?.buyerPhone ?? '',
    deliveryAddress: order?.deliveryAddress ?? job.destinationAddress ?? '',
    farmName: order?.sellerName ?? 'Seller',
    pickupAddress: job.pickupAddress ?? '',
    origin,
    destination,
    driver: {
      id: driver?.userId ?? job.driverId ?? 0,
      name: driver?.fullName ?? (job.driverId ? `Driver #${job.driverId}` : 'Not assigned'),
      phone: driver?.phone ?? '',
      vehicle: [driver?.vehicleMake, driver?.vehicleType].filter(Boolean).join(' ') || '—',
      plate: driver?.plateNumber ?? '—',
    },
    status,
    rawStatus: job.status,
    progress,
    position,
    hasLivePosition: !!fix,
    etaTotalMin,
    etaMin: done ? 0 : Math.ceil((1 - progress) * etaTotalMin),
    deliveryCode: {
      expiresAt: job.deliveryOtpExpiresAt,
      attempts: job.deliveryOtpAttempts ?? 0,
      used: !!job.deliveryOtpVerified,
      locked: lockedUntil > Date.now(),
    },
    events: evs,
    failureReason: job.cancellationReason ?? undefined,
    proof:
      pod?.deliveredAt || done
        ? {
            at: pod?.deliveredAt ?? job.updatedAt ?? new Date().toISOString(),
            position: destination,
            recipientName: pod?.recipientName,
          }
        : undefined,
  };
}
