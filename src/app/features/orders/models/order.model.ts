export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'disputed'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'held' | 'settled' | 'refunded';
export type PaymentMethod = 'mpesa' | 'card' | 'bank';
export type DeliveryStatus = 'assigned' | 'picked_up' | 'delivered';
export type Tone = 'green' | 'amber' | 'red' | 'grey' | 'blue';
export type Vehicle = 'Motorbike' | 'Pickup' | 'Van' | 'Truck';

export const PLATFORM_FEE_RATE = 0.03;

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  placed: { label: 'Placed', tone: 'grey' },
  confirmed: { label: 'Confirmed', tone: 'blue' },
  in_transit: { label: 'In Transit', tone: 'blue' },
  delivered: { label: 'Delivered', tone: 'green' },
  completed: { label: 'Completed', tone: 'green' },
  disputed: { label: 'Disputed', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'grey' },
};

export const PAYMENT_META: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'amber' },
  paid: { label: 'Paid', tone: 'green' },
  held: { label: 'Held', tone: 'amber' },
  settled: { label: 'Settled', tone: 'green' },
  refunded: { label: 'Refunded', tone: 'grey' },
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  mpesa: 'M-Pesa',
  card: 'Card',
  bank: 'Bank transfer',
};
export const PIPELINE = ['Placed', 'Confirmed', 'In Transit', 'Delivered', 'Completed'];
export const STATUS_OPTIONS = Object.keys(ORDER_STATUS_META) as OrderStatus[];

export interface OrderItem {
  productId: string | null;
  name: string;
  qty: number;
  unit: string;
  unitPriceKes: number;
}

export interface OrderEvent {
  at: string;
  text: string;
  actor: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  vehicle: Vehicle;
  plate: string;
  capacityKg: number;
  county: string;
  available: boolean;
}

export interface OrderDelivery {
  agentId: string;
  agentName: string;
  agentPhone: string;
  vehicle: Vehicle;
  plate: string;
  assignedAt: string;
  status: DeliveryStatus;
}

export interface Order {
  id: string;
  code: string; // ORD-2851
  buyer: {
    name: string;
    type: 'Corporate' | 'Individual';
    phone: string;
    county: string;
    address: string;
  };
  farmer: { name: string; phone: string; county: string; location: string };
  items: OrderItem[];
  status: OrderStatus;
  progress: number; // highest pipeline step reached (0 to 4)
  payment: {
    status: PaymentStatus;
    method: PaymentMethod | null;
    reference: string | null;
    paidAt: string | null;
  };
  delivery: OrderDelivery | null;
  note: string; // reason for a cancellation or dispute
  placedAt: string; // 2026-09-28T14:22
  events: OrderEvent[];
}

export const subtotal = (o: Order) => o.items.reduce((a, i) => a + i.qty * i.unitPriceKes, 0);
export const platformFee = (o: Order) => Math.round(subtotal(o) * PLATFORM_FEE_RATE);
export const farmerPayout = (o: Order) => subtotal(o) - platformFee(o);

/** Rough weight of the load, used to pick a vehicle that can carry it */
const KG_PER_UNIT: Record<string, number> = {
  kg: 1,
  bag: 50,
  crate: 60,
  litre: 0.92,
  tray: 2,
  bunch: 0.5,
  piece: 0.5,
};
export const loadKg = (o: Order) =>
  Math.round(o.items.reduce((a, i) => a + i.qty * (KG_PER_UNIT[i.unit] ?? 1), 0));

export const productSummary = (o: Order) =>
  o.items[0].name + (o.items.length > 1 ? ` +${o.items.length - 1} more` : '');
export const qtySummary = (o: Order) =>
  o.items.length === 1
    ? `${o.items[0].qty.toLocaleString('en-KE')} ${o.items[0].unit}`
    : `${o.items.length} items`;
