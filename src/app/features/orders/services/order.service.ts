import { Injectable, computed, signal } from '@angular/core';
import {
  Agent,
  METHOD_LABEL,
  Order,
  OrderEvent,
  OrderStatus,
  PaymentMethod,
  farmerPayout,
  subtotal,
} from '../models/order.model';

const now = () => new Date().toISOString().slice(0, 16);
const kes = (n: number) => 'KSh ' + n.toLocaleString('en-KE');
const ev = (at: string, text: string, actor: string): OrderEvent => ({ at, text, actor });

/**
 * In-memory implementation so everything works today.
 * Replace the bodies with HttpClient calls later and keep the method names.
 * markPickedUp / markDelivered are meant to be called by Logistics after a code is verified.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  /** Temporary driver list. The drivers feature will replace this. */
  readonly agents = signal<Agent[]>([
    {
      id: 'a1',
      name: 'Daniel Mwangi',
      phone: '0712555001',
      vehicle: 'Pickup',
      plate: 'KDG 214K',
      capacityKg: 1000,
      county: 'Nairobi',
      available: true,
    },
    {
      id: 'a2',
      name: 'Samuel Kibet',
      phone: '0722555002',
      vehicle: 'Truck',
      plate: 'KCB 482M',
      capacityKg: 7000,
      county: 'Nakuru',
      available: true,
    },
    {
      id: 'a3',
      name: 'Faith Wanjiku',
      phone: '0733555003',
      vehicle: 'Van',
      plate: 'KDA 905T',
      capacityKg: 1500,
      county: 'Mombasa',
      available: true,
    },
    {
      id: 'a4',
      name: 'Hassan Omar',
      phone: '0700555004',
      vehicle: 'Motorbike',
      plate: 'KMFB 336C',
      capacityKg: 50,
      county: 'Nairobi',
      available: true,
    },
    {
      id: 'a5',
      name: 'Grace Njoki',
      phone: '0744555005',
      vehicle: 'Pickup',
      plate: 'KDD 118P',
      capacityKg: 1000,
      county: 'Kiambu',
      available: true,
    },
    {
      id: 'a6',
      name: 'Peter Otieno',
      phone: '0755555006',
      vehicle: 'Truck',
      plate: 'KCA 770Z',
      capacityKg: 7000,
      county: 'Kisumu',
      available: false,
    },
  ]);

  private readonly _orders = signal<Order[]>([
    {
      id: 'o1',
      code: 'ORD-2851',
      status: 'in_transit',
      progress: 2,
      note: '',
      placedAt: '2026-09-28T14:22',
      buyer: {
        name: 'AgriMart Ltd',
        type: 'Corporate',
        phone: '0207000111',
        county: 'Nairobi',
        address: 'Industrial Area, Enterprise Road',
      },
      farmer: { name: 'Wanjiru Kamau', phone: '0712345001', county: 'Kiambu', location: 'Limuru' },
      items: [
        {
          productId: 'p1',
          name: 'Kamau Estate Black Tea (CTC)',
          qty: 800,
          unit: 'kg',
          unitPriceKes: 450,
        },
      ],
      payment: {
        status: 'paid',
        method: 'mpesa',
        reference: 'SIK3L9X2QP',
        paidAt: '2026-09-28T14:40',
      },
      delivery: {
        agentId: 'a1',
        agentName: 'Daniel Mwangi',
        agentPhone: '0712555001',
        vehicle: 'Pickup',
        plate: 'KDG 214K',
        assignedAt: '2026-09-28T16:30',
        status: 'picked_up',
      },
      events: [
        ev('2026-09-28T14:22', 'Order placed by AgriMart Ltd', 'Buyer'),
        ev('2026-09-28T14:40', 'Payment of KSh 360,000 received via M-Pesa (SIK3L9X2QP)', 'M-Pesa'),
        ev('2026-09-28T14:45', 'Order confirmed and farmer notified', 'System'),
        ev('2026-09-28T16:30', 'Assigned to Daniel Mwangi (Pickup, KDG 214K)', 'Admin'),
        ev('2026-09-29T08:15', 'Driver collected the goods (pickup code verified)', 'Driver'),
      ],
    },
    {
      id: 'o2',
      code: 'ORD-2850',
      status: 'confirmed',
      progress: 1,
      note: '',
      placedAt: '2026-09-28T10:05',
      buyer: {
        name: 'Savannah Foods Ltd',
        type: 'Corporate',
        phone: '0207000222',
        county: 'Nakuru',
        address: 'Milimani Road, Nakuru Town',
      },
      farmer: {
        name: 'Kiprono Cheruiyot',
        phone: '0722345002',
        county: 'Uasin Gishu',
        location: 'Moiben',
      },
      items: [{ productId: 'p2', name: 'Dried Maize', qty: 5000, unit: 'kg', unitPriceKes: 60 }],
      payment: {
        status: 'paid',
        method: 'bank',
        reference: 'RTGS-88421',
        paidAt: '2026-09-28T11:30',
      },
      delivery: null,
      events: [
        ev('2026-09-28T10:05', 'Order placed by Savannah Foods Ltd', 'Buyer'),
        ev(
          '2026-09-28T11:30',
          'Payment of KSh 300,000 received via Bank transfer (RTGS-88421)',
          'Admin',
        ),
        ev('2026-09-28T11:35', 'Order confirmed and farmer notified', 'Admin'),
      ],
    },
    {
      id: 'o3',
      code: 'ORD-2849',
      status: 'disputed',
      progress: 3,
      placedAt: '2026-09-27T09:12',
      note: 'Buyer says about a third of the crates arrived bruised.',
      buyer: {
        name: 'James Kariuki',
        type: 'Individual',
        phone: '0711888333',
        county: 'Nairobi',
        address: 'Kilimani, Argwings Kodhek Rd',
      },
      farmer: {
        name: 'Njeri Mwangi',
        phone: '0744345008',
        county: 'Kiambu',
        location: 'Kiambu Town',
      },
      items: [
        { productId: 'p5', name: 'Fresh Tomatoes', qty: 20, unit: 'crate', unitPriceKes: 3200 },
      ],
      payment: {
        status: 'held',
        method: 'mpesa',
        reference: 'SIJ7P2M8TD',
        paidAt: '2026-09-27T09:20',
      },
      delivery: {
        agentId: 'a2',
        agentName: 'Samuel Kibet',
        agentPhone: '0722555002',
        vehicle: 'Truck',
        plate: 'KCB 482M',
        assignedAt: '2026-09-27T10:00',
        status: 'delivered',
      },
      events: [
        ev('2026-09-27T09:12', 'Order placed by James Kariuki', 'Buyer'),
        ev('2026-09-27T09:20', 'Payment of KSh 64,000 received via M-Pesa (SIJ7P2M8TD)', 'M-Pesa'),
        ev('2026-09-27T09:30', 'Order confirmed and farmer notified', 'System'),
        ev('2026-09-27T10:00', 'Assigned to Samuel Kibet (Truck, KCB 482M)', 'Admin'),
        ev('2026-09-28T15:10', 'Delivered to the buyer (delivery code verified)', 'Driver'),
        ev(
          '2026-09-29T09:00',
          'Dispute raised: Buyer says about a third of the crates arrived bruised.',
          'Buyer',
        ),
      ],
    },
    {
      id: 'o4',
      code: 'ORD-2848',
      status: 'delivered',
      progress: 3,
      note: '',
      placedAt: '2026-09-26T13:40',
      buyer: {
        name: 'GreenBasket Grocers',
        type: 'Corporate',
        phone: '0412000333',
        county: 'Mombasa',
        address: 'Nyali, Links Road',
      },
      farmer: { name: 'Wanjiru Kamau', phone: '0712345001', county: 'Kiambu', location: 'Limuru' },
      items: [{ productId: 'p3', name: 'Hass Avocados', qty: 1000, unit: 'kg', unitPriceKes: 85 }],
      payment: {
        status: 'paid',
        method: 'mpesa',
        reference: 'SIH5K1N4WB',
        paidAt: '2026-09-26T13:55',
      },
      delivery: {
        agentId: 'a3',
        agentName: 'Faith Wanjiku',
        agentPhone: '0733555003',
        vehicle: 'Van',
        plate: 'KDA 905T',
        assignedAt: '2026-09-26T15:00',
        status: 'delivered',
      },
      events: [
        ev('2026-09-26T13:40', 'Order placed by GreenBasket Grocers', 'Buyer'),
        ev('2026-09-26T13:55', 'Payment of KSh 85,000 received via M-Pesa (SIH5K1N4WB)', 'M-Pesa'),
        ev('2026-09-26T14:00', 'Order confirmed and farmer notified', 'System'),
        ev('2026-09-26T15:00', 'Assigned to Faith Wanjiku (Van, KDA 905T)', 'Admin'),
        ev('2026-09-27T12:20', 'Delivered to the buyer (delivery code verified)', 'Driver'),
      ],
    },
    {
      id: 'o5',
      code: 'ORD-2847',
      status: 'in_transit',
      progress: 2,
      note: '',
      placedAt: '2026-09-26T08:30',
      buyer: {
        name: 'Savannah Foods Ltd',
        type: 'Corporate',
        phone: '0207000222',
        county: 'Nakuru',
        address: 'Milimani Road, Nakuru Town',
      },
      farmer: {
        name: 'Meru Nut Growers Co-op',
        phone: '0733345007',
        county: 'Meru',
        location: 'Imenti North',
      },
      items: [
        {
          productId: 'p4',
          name: 'Macadamia Nuts (in shell)',
          qty: 800,
          unit: 'kg',
          unitPriceKes: 140,
        },
      ],
      payment: {
        status: 'paid',
        method: 'card',
        reference: 'CARD-5521',
        paidAt: '2026-09-26T08:41',
      },
      delivery: {
        agentId: 'a2',
        agentName: 'Samuel Kibet',
        agentPhone: '0722555002',
        vehicle: 'Truck',
        plate: 'KCB 482M',
        assignedAt: '2026-09-26T10:00',
        status: 'picked_up',
      },
      events: [
        ev('2026-09-26T08:30', 'Order placed by Savannah Foods Ltd', 'Buyer'),
        ev('2026-09-26T08:41', 'Payment of KSh 112,000 received via Card (CARD-5521)', 'Card'),
        ev('2026-09-26T08:50', 'Order confirmed and farmer notified', 'System'),
        ev('2026-09-26T10:00', 'Assigned to Samuel Kibet (Truck, KCB 482M)', 'Admin'),
        ev('2026-09-29T07:40', 'Driver collected the goods (pickup code verified)', 'Driver'),
      ],
    },
    {
      id: 'o6',
      code: 'ORD-2846',
      status: 'completed',
      progress: 4,
      note: '',
      placedAt: '2026-09-22T11:00',
      buyer: {
        name: 'FreshPak Exports',
        type: 'Corporate',
        phone: '0412000444',
        county: 'Mombasa',
        address: 'Changamwe, Port Reitz Rd',
      },
      farmer: {
        name: 'Mwea Rice Growers',
        phone: '0755345009',
        county: 'Kirinyaga',
        location: 'Mwea',
      },
      items: [
        { productId: 'p6', name: 'Mwea Pishori Rice', qty: 2000, unit: 'kg', unitPriceKes: 180 },
      ],
      payment: {
        status: 'settled',
        method: 'bank',
        reference: 'RTGS-88102',
        paidAt: '2026-09-22T12:10',
      },
      delivery: {
        agentId: 'a1',
        agentName: 'Daniel Mwangi',
        agentPhone: '0712555001',
        vehicle: 'Pickup',
        plate: 'KDG 214K',
        assignedAt: '2026-09-22T14:00',
        status: 'delivered',
      },
      events: [
        ev('2026-09-22T11:00', 'Order placed by FreshPak Exports', 'Buyer'),
        ev(
          '2026-09-22T12:10',
          'Payment of KSh 360,000 received via Bank transfer (RTGS-88102)',
          'Admin',
        ),
        ev('2026-09-22T12:15', 'Order confirmed and farmer notified', 'Admin'),
        ev('2026-09-22T14:00', 'Assigned to Daniel Mwangi (Pickup, KDG 214K)', 'Admin'),
        ev('2026-09-24T10:30', 'Delivered to the buyer (delivery code verified)', 'Driver'),
        ev('2026-09-25T09:00', 'Payment of KSh 349,200 released to the farmer', 'Admin'),
      ],
    },
    {
      id: 'o7',
      code: 'ORD-2845',
      status: 'placed',
      progress: 0,
      note: '',
      placedAt: '2026-10-01T16:05',
      buyer: {
        name: 'AgriMart Ltd',
        type: 'Corporate',
        phone: '0207000111',
        county: 'Nairobi',
        address: 'Industrial Area, Enterprise Road',
      },
      farmer: { name: 'Mutua Musyoka', phone: '0720345006', county: 'Kitui', location: 'Mwingi' },
      items: [{ productId: 'p7', name: 'Rosecoco Beans', qty: 500, unit: 'kg', unitPriceKes: 150 }],
      payment: { status: 'pending', method: null, reference: null, paidAt: null },
      delivery: null,
      events: [ev('2026-10-01T16:05', 'Order placed by AgriMart Ltd', 'Buyer')],
    },
  ]);

  readonly orders = this._orders.asReadonly();

  readonly stats = computed(() => {
    const l = this._orders();
    const by = (s: OrderStatus) => {
      const rows = l.filter((o) => o.status === s);
      return { count: rows.length, value: rows.reduce((a, o) => a + subtotal(o), 0) };
    };
    return {
      placed: by('placed'),
      confirmed: by('confirmed'),
      in_transit: by('in_transit'),
      delivered: by('delivered'),
      completed: by('completed'),
      disputed: by('disputed').count,
    };
  });

  getById(id: string) {
    return this._orders().find((o) => o.id === id);
  }
  agentLoad(agentId: string) {
    return this._orders().filter(
      (o) => o.delivery?.agentId === agentId && ['confirmed', 'in_transit'].includes(o.status),
    ).length;
  }

  private apply(id: string, fn: (o: Order) => Partial<Order>, text: string, actor = 'Admin') {
    this._orders.update((l) =>
      l.map((o) =>
        o.id === id ? { ...o, ...fn(o), events: [...o.events, { at: now(), text, actor }] } : o,
      ),
    );
  }

  recordPayment(id: string, method: PaymentMethod, reference: string) {
    this.apply(
      id,
      (o) => ({ payment: { status: 'paid', method, reference, paidAt: now() } }),
      `Payment of ${kes(subtotal(this.getById(id)!))} received via ${METHOD_LABEL[method]} (${reference})`,
    );
  }

  confirm(id: string) {
    this.apply(
      id,
      () => ({ status: 'confirmed', progress: 1 }),
      'Order confirmed and farmer notified',
    );
  }

  assignDriver(id: string, agentId: string) {
    const a = this.agents().find((x) => x.id === agentId);
    if (!a) return;
    const re = !!this.getById(id)?.delivery;
    this.apply(
      id,
      () => ({
        delivery: {
          agentId: a.id,
          agentName: a.name,
          agentPhone: a.phone,
          vehicle: a.vehicle,
          plate: a.plate,
          assignedAt: now(),
          status: 'assigned',
        },
      }),
      `${re ? 'Reassigned' : 'Assigned'} to ${a.name} (${a.vehicle}, ${a.plate})`,
    );
  }

  /** Called by Logistics once the pickup code is verified */
  markPickedUp(id: string) {
    this.apply(
      id,
      (o) => ({
        status: 'in_transit',
        progress: 2,
        delivery: o.delivery && { ...o.delivery, status: 'picked_up' },
      }),
      'Driver collected the goods (pickup code verified)',
      'Driver',
    );
  }

  /** Called by Logistics once the delivery code is verified */
  markDelivered(id: string) {
    this.apply(
      id,
      (o) => ({
        status: 'delivered',
        progress: 3,
        delivery: o.delivery && { ...o.delivery, status: 'delivered' },
      }),
      'Delivered to the buyer (delivery code verified)',
      'Driver',
    );
  }

  /** Pays the farmer (minus the platform fee) and closes the order */
  complete(id: string) {
    this.apply(
      id,
      () => ({
        status: 'completed',
        progress: 4,
        payment: { ...this.getById(id)!.payment, status: 'settled' },
      }),
      `Payment of ${kes(farmerPayout(this.getById(id)!))} released to the farmer`,
    );
  }

  cancel(id: string, reason: string) {
    const o = this.getById(id)!;
    this.apply(
      id,
      () => ({
        status: 'cancelled',
        note: reason,
        payment: {
          ...o.payment,
          status: o.payment.status === 'paid' ? 'refunded' : o.payment.status,
        },
      }),
      `Order cancelled: ${reason}${o.payment.status === 'paid' ? '. Buyer refunded.' : ''}`,
    );
  }

  dispute(id: string, reason: string) {
    const o = this.getById(id)!;
    this.apply(
      id,
      () => ({
        status: 'disputed',
        note: reason,
        payment: { ...o.payment, status: o.payment.status === 'paid' ? 'held' : o.payment.status },
      }),
      `Dispute raised: ${reason}`,
    );
  }

  resolveDispute(id: string, favour: 'buyer' | 'farmer', note: string) {
    const o = this.getById(id)!;
    if (favour === 'buyer') {
      this.apply(
        id,
        () => ({ status: 'cancelled', note, payment: { ...o.payment, status: 'refunded' } }),
        `Dispute resolved in the buyer's favour. Buyer refunded. ${note}`,
      );
    } else {
      this.apply(
        id,
        () => ({ status: 'completed', progress: 4, payment: { ...o.payment, status: 'settled' } }),
        `Dispute resolved in the farmer's favour. ${kes(farmerPayout(o))} released. ${note}`,
      );
    }
  }
}
