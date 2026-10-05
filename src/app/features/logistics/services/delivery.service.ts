import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { OrderService } from '../../orders/services/order.service';
import {
  CodeKind,
  DeliveryCode,
  Driver,
  EventKey,
  GeoPoint,
  MAX_CODE_ATTEMPTS,
  Delivery,
  DeliveryEvent,
  VerifyResult,
} from '../models/delivery.model';

const DRIVERS: Driver[] = [
  {
    id: 'd1',
    name: 'Peter Kamau',
    phone: '+254712345678',
    vehicle: 'Isuzu NPR truck',
    plate: 'KDA 123A',
  },
  {
    id: 'd2',
    name: 'Grace Wanjiru',
    phone: '+254723456789',
    vehicle: 'Pickup truck',
    plate: 'KCB 456B',
  },
  {
    id: 'd3',
    name: 'Samuel Otieno',
    phone: '+254734567890',
    vehicle: 'Canter lorry',
    plate: 'KDG 789C',
  },
  {
    id: 'd4',
    name: 'Brian Kiplagat',
    phone: '+254745678901',
    vehicle: 'Pickup truck',
    plate: 'KDM 321D',
  },
];

const makeCode = (hours: number): DeliveryCode => ({
  value: String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0'),
  expiresAt: new Date(Date.now() + hours * 3_600_000).toISOString(),
  attempts: 0,
  used: false,
  locked: false,
});

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const ev = (key: EventKey, label: string, minAgo: number): DeliveryEvent => ({
  key,
  label,
  at: ago(minAgo),
});
const lerp = (a: GeoPoint, b: GeoPoint, t: number): GeoPoint => ({
  lat: a.lat + (b.lat - a.lat) * t,
  lng: a.lng + (b.lng - a.lng) * t,
});
const used = (c: DeliveryCode): DeliveryCode => ({ ...c, used: true });

const pt = (lat: number, lng: number): GeoPoint => ({ lat, lng });
const NAKURU = pt(-0.3031, 36.08),
  NAIROBI = pt(-1.2921, 36.8219),
  MERU = pt(0.047, 37.6559),
  NAIVASHA = pt(-0.7172, 36.431),
  ELDORET = pt(0.5143, 35.2698);

function seed(): Delivery[] {
  const base = (
    o: Partial<Delivery> & Pick<Delivery, 'id' | 'orderId' | 'origin' | 'destination'>,
  ): Delivery => ({
    buyerName: '',
    buyerPhone: '',
    deliveryAddress: '',
    farmName: '',
    pickupAddress: '',
    driver: DRIVERS[0],
    status: 'assigned',
    progress: 0,
    position: o.origin,
    etaTotalMin: 240,
    etaMin: 240,
    pickupCode: makeCode(24),
    deliveryCode: makeCode(48),
    events: [],
    ...o,
  });
  return [
    base({
      id: 'SHP-001',
      orderId: 'ORD-2851',
      buyerName: 'Mary Achieng',
      buyerPhone: '+254700111222',
      farmName: 'Rift Valley Fresh',
      pickupAddress: 'Nakuru',
      deliveryAddress: 'Nairobi',
      origin: NAKURU,
      destination: NAIROBI,
      driver: DRIVERS[0],
      status: 'in_transit',
      progress: 0.5,
      position: lerp(NAKURU, NAIROBI, 0.5),
      etaTotalMin: 150,
      etaMin: 75,
      pickupCode: used(makeCode(24)),
      events: [
        ev('assigned', 'Driver assigned', 200),
        ev('picked_up', 'Picked up at farm', 75),
        ev('in_transit', 'On the way', 75),
      ],
    }),
    base({
      id: 'SHP-002',
      orderId: 'ORD-2847',
      buyerName: 'John Mwangi',
      buyerPhone: '+254700333444',
      farmName: 'Meru Highlands Co-op',
      pickupAddress: 'Meru',
      deliveryAddress: 'Nairobi',
      origin: MERU,
      destination: NAIROBI,
      driver: DRIVERS[1],
      status: 'in_transit',
      progress: 0.3,
      position: lerp(MERU, NAIROBI, 0.3),
      etaTotalMin: 270,
      etaMin: 189,
      pickupCode: used(makeCode(24)),
      events: [
        ev('assigned', 'Driver assigned', 300),
        ev('picked_up', 'Picked up at farm', 81),
        ev('in_transit', 'On the way', 81),
      ],
    }),
    base({
      id: 'SHP-003',
      orderId: 'ORD-2848',
      buyerName: 'Fatuma Hassan',
      buyerPhone: '+254700555666',
      farmName: 'Naivasha Greens',
      pickupAddress: 'Naivasha',
      deliveryAddress: 'Nairobi',
      origin: NAIVASHA,
      destination: NAIROBI,
      driver: DRIVERS[2],
      status: 'delivered',
      progress: 1,
      position: NAIROBI,
      etaTotalMin: 90,
      etaMin: 0,
      pickupCode: used(makeCode(24)),
      deliveryCode: used(makeCode(48)),
      events: [
        ev('assigned', 'Driver assigned', 3200),
        ev('picked_up', 'Picked up at farm', 2900),
        ev('in_transit', 'On the way', 2900),
        ev('arrived', 'Driver arrived', 2800),
        ev('delivered', 'Delivered. Code confirmed by buyer', 2790),
      ],
      proof: { at: ago(2790), position: NAIROBI, method: 'delivery_code' },
    }),
    // Test row so you can try the pickup code. Delete it when real data arrives.
    base({
      id: 'SHP-004',
      orderId: 'ORD-2852',
      buyerName: 'David Kiprop',
      buyerPhone: '+254700777888',
      farmName: 'Uasin Gishu Grains',
      pickupAddress: 'Eldoret',
      deliveryAddress: 'Nakuru',
      origin: ELDORET,
      destination: NAKURU,
      driver: DRIVERS[3],
      etaTotalMin: 150,
      etaMin: 150,
      events: [ev('assigned', 'Driver assigned', 20)],
    }),
  ];
}

@Injectable({ providedIn: 'root' })
export class DeliveryService implements OnDestroy {
  private orders = inject(OrderService);
  private _deliveries = signal<Delivery[]>(seed());
  private timer = setInterval(() => this.tick(), 1000); // simulated driver GPS

  readonly deliveries = this._deliveries.asReadonly();
  readonly drivers = DRIVERS;
  readonly stats = computed(() => {
    const l = this._deliveries();
    const n = (s: Delivery['status']) => l.filter((x) => x.status === s).length;
    return {
      assigned: n('assigned'),
      in_transit: n('in_transit'),
      arrived: n('arrived'),
      delivered: n('delivered'),
      failed: n('failed'),
    };
  });

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  get(id: string) {
    return this._deliveries().find((s) => s.id === id);
  }
  getByOrderId(orderId: string) {
    return this._deliveries().find((s) => s.orderId === orderId);
  }

  /** The driver enters a code. Same entry point for pickup and delivery. */
  verify(id: string, kind: CodeKind, input: string): VerifyResult {
    const s = this.get(id);
    if (!s) return fail('Delivery not found.');
    if (kind === 'pickup' && s.status !== 'assigned')
      return fail('Pickup can only be confirmed while the delivery is waiting for pickup.');
    if (kind === 'delivery' && s.status !== 'arrived')
      return fail('The driver must arrive before delivery can be confirmed.');

    const code = kind === 'pickup' ? s.pickupCode : s.deliveryCode;
    if (code.used) return fail('This code was already used.');
    if (code.locked)
      return fail('This code is locked after too many wrong attempts. Ask an admin to reset it.');
    if (Date.parse(code.expiresAt) < Date.now())
      return fail('This code has expired. Ask an admin to reset it.');

    if (input.trim() !== code.value) {
      const attempts = code.attempts + 1;
      const locked = attempts >= MAX_CODE_ATTEMPTS;
      this.patch(id, (x) => ({
        ...withCode(x, kind, { ...code, attempts, locked }),
        events: locked
          ? [...x.events, event('code_locked', `${label(kind)} code locked`)]
          : x.events,
      }));
      return fail(
        locked
          ? 'Wrong code. The code is now locked.'
          : `Wrong code. ${MAX_CODE_ATTEMPTS - attempts} attempt(s) left.`,
      );
    }

    if (kind === 'pickup') {
      this.patch(id, (x) => ({
        ...withCode(x, 'pickup', { ...code, used: true }),
        status: 'in_transit',
        events: [
          ...x.events,
          event('picked_up', 'Picked up at farm'),
          event('in_transit', 'On the way'),
        ],
      }));
      this.syncOrder(() => this.orders.markPickedUp(s.orderId));
      return { ok: true, message: 'Pickup confirmed. The order is now in transit.' };
    }
    this.patch(id, (x) => ({
      ...withCode(x, 'delivery', { ...code, used: true }),
      status: 'delivered',
      progress: 1,
      etaMin: 0,
      events: [...x.events, event('delivered', 'Delivered. Code confirmed by buyer')],
      proof: { at: new Date().toISOString(), position: x.position, method: 'delivery_code' },
    }));
    this.syncOrder(() => this.orders.markDelivered(s.orderId));
    return { ok: true, message: 'Delivery confirmed. The order is now delivered.' };
  }

  /** Admin: issue a fresh code and clear the attempt counter. Used codes cannot be reset. */
  resetCode(id: string, kind: CodeKind): VerifyResult {
    const s = this.get(id);
    if (!s) return fail('Delivery not found.');
    const code = kind === 'pickup' ? s.pickupCode : s.deliveryCode;
    if (code.used) return fail('This code was already used.');
    this.patch(id, (x) => ({
      ...withCode(x, kind, makeCode(kind === 'pickup' ? 24 : 48)),
      events: [...x.events, event('code_reset', `${label(kind)} code reset by admin`)],
    }));
    return { ok: true, message: `${label(kind)} code reset.` };
  }

  /** Admin: only before pickup, or after a failed delivery (goods are back at the farm). */
  reassign(id: string, driverId: string): VerifyResult {
    const s = this.get(id);
    const driver = DRIVERS.find((d) => d.id === driverId);
    if (!s || !driver) return fail('Pick a driver first.');
    if (s.status !== 'assigned' && s.status !== 'failed')
      return fail('A driver can only be reassigned before pickup or after a failed delivery.');
    this.patch(id, (x) => ({
      ...x,
      driver,
      status: 'assigned',
      progress: 0,
      position: x.origin,
      etaMin: x.etaTotalMin,
      failureReason: undefined,
      pickupCode: makeCode(24),
      deliveryCode: makeCode(48),
      events: [...x.events, event('reassigned', `Reassigned to ${driver.name}`)],
    }));
    return {
      ok: true,
      message: `Reassigned to ${driver.name}. New pickup and delivery codes were issued.`,
    };
  }

  markFailed(id: string, reason: string): VerifyResult {
    const s = this.get(id);
    if (!s) return fail('Delivery not found.');
    if (!reason.trim()) return fail('Write the reason for the failed delivery.');
    if (s.status === 'delivered' || s.status === 'failed')
      return fail('This delivery is already closed.');
    this.patch(id, (x) => ({
      ...x,
      status: 'failed',
      failureReason: reason.trim(),
      events: [...x.events, event('failed', `Delivery failed: ${reason.trim()}`)],
    }));
    return { ok: true, message: 'Marked as failed. You can reassign a driver.' };
  }

  // ---- internals ----
  private tick() {
    if (!this._deliveries().some((s) => s.status === 'in_transit')) return;
    this._deliveries.update((list) =>
      list.map((s) => {
        if (s.status !== 'in_transit') return s;
        const progress = Math.min(1, s.progress + 0.04);
        const arrived = progress >= 1;
        return {
          ...s,
          progress,
          position: lerp(s.origin, s.destination, progress),
          etaMin: Math.ceil((1 - progress) * s.etaTotalMin),
          status: arrived ? 'arrived' : s.status,
          events: arrived ? [...s.events, event('arrived', 'Driver arrived')] : s.events,
        };
      }),
    );
  }

  private patch(id: string, fn: (s: Delivery) => Delivery) {
    this._deliveries.update((l) => l.map((s) => (s.id === id ? fn(s) : s)));
  }

  // The mock orders may not contain our seeded ids. A real API call would fail loudly instead.
  private syncOrder(call: () => void) {
    try {
      call();
    } catch (e) {
      console.warn('Order sync skipped:', e);
    }
  }
}

const fail = (message: string): VerifyResult => ({ ok: false, message });
const label = (k: CodeKind) => (k === 'pickup' ? 'Pickup' : 'Delivery');
const event = (key: EventKey, text: string): DeliveryEvent => ({
  key,
  label: text,
  at: new Date().toISOString(),
});
const withCode = (s: Delivery, k: CodeKind, c: DeliveryCode): Delivery =>
  k === 'pickup' ? { ...s, pickupCode: c } : { ...s, deliveryCode: c };
