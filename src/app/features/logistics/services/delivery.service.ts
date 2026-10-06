import { Injectable, OnDestroy, computed, signal } from '@angular/core';

import {
  CodeKind,
  Delivery,
  DeliveryCode,
  DeliveryEvent,
  Driver,
  EventKey,
  GeoPoint,
  MAX_CODE_ATTEMPTS,
  VerifyResult,
} from '../models/delivery.model';

/*
 * ---------------------------------------------------------------------------
 * MOCK DRIVERS
 * ---------------------------------------------------------------------------
 *
 * These are temporary drivers for the logistics UI.
 *
 * Later, replace this list with an API call from the backend.
 */
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

/*
 * ---------------------------------------------------------------------------
 * HELPERS
 * ---------------------------------------------------------------------------
 */

const makeCode = (hours: number): DeliveryCode => ({
  value: String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0'),

  expiresAt: new Date(Date.now() + hours * 3_600_000).toISOString(),

  attempts: 0,
  used: false,
  locked: false,
});

const ago = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString();

const event = (key: EventKey, text: string): DeliveryEvent => ({
  key,
  label: text,
  at: new Date().toISOString(),
});

const historicalEvent = (key: EventKey, label: string, minutesAgo: number): DeliveryEvent => ({
  key,
  label,
  at: ago(minutesAgo),
});

const lerp = (a: GeoPoint, b: GeoPoint, t: number): GeoPoint => ({
  lat: a.lat + (b.lat - a.lat) * t,
  lng: a.lng + (b.lng - a.lng) * t,
});

const point = (lat: number, lng: number): GeoPoint => ({
  lat,
  lng,
});

const usedCode = (code: DeliveryCode): DeliveryCode => ({
  ...code,
  used: true,
});

const withCode = (delivery: Delivery, kind: CodeKind, code: DeliveryCode): Delivery => {
  if (kind === 'pickup') {
    return {
      ...delivery,
      pickupCode: code,
    };
  }

  return {
    ...delivery,
    deliveryCode: code,
  };
};

const fail = (message: string): VerifyResult => ({
  ok: false,
  message,
});

const label = (kind: CodeKind): string => (kind === 'pickup' ? 'Pickup' : 'Delivery');

/*
 * ---------------------------------------------------------------------------
 * KENYAN LOCATIONS
 * ---------------------------------------------------------------------------
 */

const NAKURU = point(-0.3031, 36.08);

const NAIROBI = point(-1.2921, 36.8219);

const MERU = point(0.047, 37.6559);

const NAIVASHA = point(-0.7172, 36.431);

const ELDORET = point(0.5143, 35.2698);

/*
 * ---------------------------------------------------------------------------
 * DEMO DELIVERY DATA
 * ---------------------------------------------------------------------------
 */

function createSeedDeliveries(): Delivery[] {
  const base = (
    delivery: Partial<Delivery> & Pick<Delivery, 'id' | 'orderId' | 'origin' | 'destination'>,
  ): Delivery => ({
    buyerName: '',
    buyerPhone: '',

    deliveryAddress: '',

    farmName: '',
    pickupAddress: '',

    driver: DRIVERS[0],

    status: 'assigned',

    progress: 0,

    position: delivery.origin,

    etaTotalMin: 240,
    etaMin: 240,

    pickupCode: makeCode(24),
    deliveryCode: makeCode(48),

    events: [],

    ...delivery,
  });

  return [
    /*
     * Delivery 1
     */
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

      pickupCode: usedCode(makeCode(24)),

      events: [
        historicalEvent('assigned', 'Driver assigned', 200),

        historicalEvent('picked_up', 'Picked up at farm', 75),

        historicalEvent('in_transit', 'On the way', 75),
      ],
    }),

    /*
     * Delivery 2
     */
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

      pickupCode: usedCode(makeCode(24)),

      events: [
        historicalEvent('assigned', 'Driver assigned', 300),

        historicalEvent('picked_up', 'Picked up at farm', 81),

        historicalEvent('in_transit', 'On the way', 81),
      ],
    }),

    /*
     * Delivery 3
     */
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

      pickupCode: usedCode(makeCode(24)),

      deliveryCode: usedCode(makeCode(48)),

      events: [
        historicalEvent('assigned', 'Driver assigned', 3200),

        historicalEvent('picked_up', 'Picked up at farm', 2900),

        historicalEvent('in_transit', 'On the way', 2900),

        historicalEvent('arrived', 'Driver arrived', 2800),

        historicalEvent('delivered', 'Delivered. Code confirmed by buyer', 2790),
      ],

      proof: {
        at: ago(2790),
        position: NAIROBI,
        method: 'delivery_code',
      },
    }),

    /*
     * Delivery 4
     *
     * Test delivery for the pickup-code workflow.
     */
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

      status: 'assigned',

      progress: 0,

      position: ELDORET,

      etaTotalMin: 150,
      etaMin: 150,

      events: [historicalEvent('assigned', 'Driver assigned', 20)],
    }),
  ];
}

/*
 * ---------------------------------------------------------------------------
 * DELIVERY SERVICE
 * ---------------------------------------------------------------------------
 *
 * This is currently an in-memory logistics service.
 *
 * IMPORTANT:
 * It does NOT call OrderService.markPickedUp()
 * or OrderService.markDelivered().
 *
 * Those methods do not exist in your real OrderService.
 *
 * When the backend logistics API is ready, this service can be converted
 * to HttpClient calls without changing the UI structure too much.
 */
@Injectable({
  providedIn: 'root',
})
export class DeliveryService implements OnDestroy {
  private readonly _deliveries = signal<Delivery[]>(createSeedDeliveries());

  /*
   * Simulated GPS timer.
   *
   * Every second, an in-transit delivery moves slightly
   * closer to its destination.
   */
  private readonly timer = setInterval(() => this.tick(), 1_000);

  /*
   * Public readonly delivery list.
   */
  readonly deliveries = this._deliveries.asReadonly();

  /*
   * Public driver list.
   *
   * AssignDriverDialog can use:
   *
   * this.deliveryService.drivers
   */
  readonly drivers = DRIVERS;

  /*
   * Delivery statistics.
   */
  readonly stats = computed(() => {
    const list = this._deliveries();

    const count = (status: Delivery['status']): number =>
      list.filter((delivery) => delivery.status === status).length;

    return {
      assigned: count('assigned'),
      in_transit: count('in_transit'),
      arrived: count('arrived'),
      delivered: count('delivered'),
      failed: count('failed'),
    };
  });

  /*
   * Clean up the simulated GPS timer.
   */
  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  /*
   * -------------------------------------------------------------------------
   * LOOKUPS
   * -------------------------------------------------------------------------
   */

  get(id: string): Delivery | undefined {
    return this._deliveries().find((delivery) => delivery.id === id);
  }

  getByOrderId(orderId: string): Delivery | undefined {
    return this._deliveries().find((delivery) => delivery.orderId === orderId);
  }

  /*
   * -------------------------------------------------------------------------
   * DRIVER ASSIGNMENT
   * -------------------------------------------------------------------------
   */

  reassign(id: string, driverId: string): VerifyResult {
    const delivery = this.get(id);

    if (!delivery) {
      return fail('Delivery not found.');
    }

    const driver = this.drivers.find((item) => item.id === driverId);

    if (!driver) {
      return fail('Pick a valid driver first.');
    }

    /*
     * Reassignment is allowed:
     *
     * - before pickup
     * - after failed delivery
     */
    if (delivery.status !== 'assigned' && delivery.status !== 'failed') {
      return fail('A driver can only be reassigned before pickup or after a failed delivery.');
    }

    this.patch(id, (current) => ({
      ...current,

      driver,

      status: 'assigned',

      progress: 0,

      position: current.origin,

      etaMin: current.etaTotalMin,

      failureReason: undefined,

      pickupCode: makeCode(24),

      deliveryCode: makeCode(48),

      events: [...current.events, event('reassigned', `Reassigned to ${driver.name}`)],
    }));

    return {
      ok: true,

      message: `Reassigned to ${driver.name}. ` + 'New pickup and delivery codes were issued.',
    };
  }

  /*
   * -------------------------------------------------------------------------
   * CODE VERIFICATION
   * -------------------------------------------------------------------------
   *
   * The driver enters either:
   *
   * - pickup code
   * - delivery code
   */
  verify(id: string, kind: CodeKind, input: string): VerifyResult {
    const delivery = this.get(id);

    if (!delivery) {
      return fail('Delivery not found.');
    }

    /*
     * Pickup is only possible while assigned.
     */
    if (kind === 'pickup' && delivery.status !== 'assigned') {
      return fail('Pickup can only be confirmed while the delivery is waiting for pickup.');
    }

    /*
     * Delivery confirmation is only possible
     * after the driver has arrived.
     */
    if (kind === 'delivery' && delivery.status !== 'arrived') {
      return fail('The driver must arrive before delivery can be confirmed.');
    }

    const code = kind === 'pickup' ? delivery.pickupCode : delivery.deliveryCode;

    /*
     * Prevent reuse.
     */
    if (code.used) {
      return fail('This code was already used.');
    }

    /*
     * Prevent attempts after lock.
     */
    if (code.locked) {
      return fail('This code is locked after too many wrong attempts. Ask an admin to reset it.');
    }

    /*
     * Check expiry.
     */
    if (Date.parse(code.expiresAt) < Date.now()) {
      return fail('This code has expired. Ask an admin to reset it.');
    }

    /*
     * Check the actual code.
     */
    if (input.trim() !== code.value) {
      const attempts = code.attempts + 1;

      const locked = attempts >= MAX_CODE_ATTEMPTS;

      this.patch(id, (current) => ({
        ...withCode(current, kind, {
          ...code,
          attempts,
          locked,
        }),

        events: locked
          ? [...current.events, event('code_locked', `${label(kind)} code locked`)]
          : current.events,
      }));

      return fail(
        locked
          ? 'Wrong code. The code is now locked.'
          : `Wrong code. ${MAX_CODE_ATTEMPTS - attempts} attempt(s) left.`,
      );
    }

    /*
     * -----------------------------------------------------------------------
     * PICKUP SUCCESS
     * -----------------------------------------------------------------------
     */
    if (kind === 'pickup') {
      this.patch(id, (current) => ({
        ...withCode(current, 'pickup', {
          ...code,
          used: true,
        }),

        status: 'in_transit',

        events: [
          ...current.events,

          event('picked_up', 'Picked up at farm'),

          event('in_transit', 'On the way'),
        ],
      }));

      /*
       * IMPORTANT:
       *
       * We do not call OrderService here.
       *
       * The real backend order status should eventually
       * be updated through the appropriate logistics/order
       * API endpoint.
       */

      return {
        ok: true,

        message: 'Pickup confirmed. The order is now in transit.',
      };
    }

    /*
     * -----------------------------------------------------------------------
     * DELIVERY SUCCESS
     * -----------------------------------------------------------------------
     */

    this.patch(id, (current) => ({
      ...withCode(current, 'delivery', {
        ...code,
        used: true,
      }),

      status: 'delivered',

      progress: 1,

      etaMin: 0,

      position: current.destination,

      events: [...current.events, event('delivered', 'Delivered. Code confirmed by buyer')],

      proof: {
        at: new Date().toISOString(),
        position: current.destination,
        method: 'delivery_code',
      },
    }));

    /*
     * Again, no OrderService.markDelivered().
     *
     * That method does not exist in the real OrderService.
     */

    return {
      ok: true,

      message: 'Delivery confirmed. The order is now delivered.',
    };
  }

  /*
   * -------------------------------------------------------------------------
   * RESET CODE
   * -------------------------------------------------------------------------
   */

  resetCode(id: string, kind: CodeKind): VerifyResult {
    const delivery = this.get(id);

    if (!delivery) {
      return fail('Delivery not found.');
    }

    const code = kind === 'pickup' ? delivery.pickupCode : delivery.deliveryCode;

    /*
     * A used code should never be reset.
     */
    if (code.used) {
      return fail('This code was already used.');
    }

    this.patch(id, (current) => ({
      ...withCode(current, kind, makeCode(kind === 'pickup' ? 24 : 48)),

      events: [...current.events, event('code_reset', `${label(kind)} code reset by admin`)],
    }));

    return {
      ok: true,

      message: `${label(kind)} code reset.`,
    };
  }

  /*
   * -------------------------------------------------------------------------
   * MARK DELIVERY AS FAILED
   * -------------------------------------------------------------------------
   */

  markFailed(id: string, reason: string): VerifyResult {
    const delivery = this.get(id);

    if (!delivery) {
      return fail('Delivery not found.');
    }

    if (!reason.trim()) {
      return fail('Write the reason for the failed delivery.');
    }

    if (delivery.status === 'delivered' || delivery.status === 'failed') {
      return fail('This delivery is already closed.');
    }

    this.patch(id, (current) => ({
      ...current,

      status: 'failed',

      failureReason: reason.trim(),

      events: [...current.events, event('failed', `Delivery failed: ${reason.trim()}`)],
    }));

    return {
      ok: true,

      message: 'Marked as failed. You can reassign a driver.',
    };
  }

  /*
   * -------------------------------------------------------------------------
   * SIMULATED GPS
   * -------------------------------------------------------------------------
   *
   * This is only for the current mock logistics UI.
   *
   * Real implementation will receive driver coordinates
   * from the backend/driver application.
   */
  private tick(): void {
    const list = this._deliveries();

    /*
     * Nothing to update if there are no deliveries in transit.
     */
    if (!list.some((delivery) => delivery.status === 'in_transit')) {
      return;
    }

    this._deliveries.update((deliveries) =>
      deliveries.map((delivery) => {
        if (delivery.status !== 'in_transit') {
          return delivery;
        }

        /*
         * Move the driver 4% closer
         * on every simulated tick.
         */
        const progress = Math.min(1, delivery.progress + 0.04);

        const arrived = progress >= 1;

        return {
          ...delivery,

          progress,

          position: lerp(delivery.origin, delivery.destination, progress),

          etaMin: Math.ceil((1 - progress) * delivery.etaTotalMin),

          status: arrived ? 'arrived' : 'in_transit',

          events: arrived
            ? [...delivery.events, event('arrived', 'Driver arrived')]
            : delivery.events,
        };
      }),
    );
  }

  /*
   * -------------------------------------------------------------------------
   * INTERNAL PATCH
   * -------------------------------------------------------------------------
   */

  private patch(id: string, update: (delivery: Delivery) => Delivery): void {
    this._deliveries.update((deliveries) =>
      deliveries.map((delivery) => (delivery.id === id ? update(delivery) : delivery)),
    );
  }
}
