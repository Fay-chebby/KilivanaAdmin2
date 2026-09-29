import { Injectable, computed, signal } from '@angular/core';
import {
  Farmer,
  FarmerDetail,
  FarmerFormValue,
  FarmerStats,
  FarmerOrder,
} from '../models/farmer.model';

/**
 * State lives in a signal so every page updates instantly.
 * Swap the bodies of these methods for ApiService calls when the backend is ready.
 */
const SEED: Farmer[] = [
  {
    id: '1',
    code: 'F-001',
    name: 'Amara Osei',
    email: 'amara.osei@mail.com',
    phone: '+233 24 111 2233',
    region: 'Ashanti',
    crops: ['Cocoa', 'Maize'],
    status: 'verified',
    kyc: 'approved',
    farms: 3,
    rating: 4.8,
    revenue: 24800,
    joinedAt: '2023-11-02',
  },
  {
    id: '2',
    code: 'F-002',
    name: 'Fatima Al-Hassan',
    email: 'fatima.hassan@mail.com',
    phone: '+233 20 987 6543',
    region: 'Northern',
    crops: ['Rice', 'Sorghum'],
    status: 'pending',
    kyc: 'pending',
    farms: 1,
    rating: 4.2,
    revenue: 8400,
    joinedAt: '2024-01-08',
  },
  {
    id: '3',
    code: 'F-003',
    name: 'Kwame Mensah',
    email: 'kwame.mensah@mail.com',
    phone: '+233 55 300 4411',
    region: 'Volta',
    crops: ['Cassava', 'Yam'],
    status: 'verified',
    kyc: 'approved',
    farms: 2,
    rating: 4.6,
    revenue: 31200,
    joinedAt: '2023-09-15',
  },
  {
    id: '4',
    code: 'F-004',
    name: 'Esi Ankrah',
    email: 'esi.ankrah@mail.com',
    phone: '+233 27 510 7788',
    region: 'Eastern',
    crops: ['Tomato', 'Pepper'],
    status: 'suspended',
    kyc: 'approved',
    farms: 1,
    rating: 3.1,
    revenue: 5600,
    joinedAt: '2023-12-20',
  },
  {
    id: '5',
    code: 'F-005',
    name: 'Kofi Darko',
    email: 'kofi.darko@mail.com',
    phone: '+233 24 620 9900',
    region: 'Central',
    crops: ['Cocoa', 'Palm Oil'],
    status: 'verified',
    kyc: 'approved',
    farms: 4,
    rating: 4.9,
    revenue: 62000,
    joinedAt: '2023-06-01',
  },
  {
    id: '6',
    code: 'F-006',
    name: 'Adjoa Boateng',
    email: 'adjoa.boateng@mail.com',
    phone: '+233 50 240 1122',
    region: 'Western',
    crops: ['Rubber', 'Coconut'],
    status: 'pending',
    kyc: 'under_review',
    farms: 2,
    rating: null,
    revenue: null,
    joinedAt: '2024-02-11',
  },
  {
    id: '7',
    code: 'F-007',
    name: 'Nana Acheampong',
    email: 'nana.acheamp@mail.com',
    phone: '+233 24 880 3344',
    region: 'Brong-Ahafo',
    crops: ['Cashew', 'Mango'],
    status: 'verified',
    kyc: 'approved',
    farms: 5,
    rating: 4.7,
    revenue: 88500,
    joinedAt: '2023-05-19',
  },
  {
    id: '8',
    code: 'F-008',
    name: 'Yaw Asante',
    email: 'yaw.asante@mail.com',
    phone: '+233 26 770 5566',
    region: 'Greater Accra',
    crops: ['Vegetables', 'Herbs'],
    status: 'verified',
    kyc: 'approved',
    farms: 1,
    rating: 4.4,
    revenue: 12300,
    joinedAt: '2024-01-22',
  },
];

const DEMO_ORDERS: Record<string, FarmerOrder[]> = {
  '2': [
    {
      id: 'ORD-2851',
      product: 'Cocoa Beans',
      buyer: 'AgriMart Ltd',
      amount: 14400,
      status: 'in_transit',
    },
    {
      id: 'ORD-2841',
      product: 'Cocoa Beans',
      buyer: 'Ghana Foods Co.',
      amount: 8200,
      status: 'completed',
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class FarmerService {
  private readonly _farmers = signal<Farmer[]>(SEED);
  readonly farmers = this._farmers.asReadonly();

  readonly stats = computed<FarmerStats>(() => {
    const list = this._farmers();
    const count = (s: Farmer['status']) => list.filter((f) => f.status === s).length;
    return {
      total: list.length,
      verified: count('verified'),
      pending: count('pending'),
      suspended: count('suspended'),
    };
  });

  getById(id: string): Farmer | undefined {
    return this._farmers().find((f) => f.id === id);
  }

  /** Reads the signal, so calling it inside computed() stays reactive. */
  getDetail(id: string): FarmerDetail | undefined {
    const f = this.getById(id);
    if (!f) return undefined;
    return {
      ...f,
      cropPortfolio: f.crops.map((name) => ({ name, active: true })),
      performance: {
        totalOrders: 47,
        completionRate: 96.2,
        avgResponse: '< 2 hrs',
        disputes: f.status === 'pending' ? 1 : 0,
      },
      orders: DEMO_ORDERS[f.id] ?? [],
      farmList: Array.from({ length: f.farms }, (_, i) => ({
        id: `${f.id}-${i + 1}`,
        name: `${f.name.split(' ')[0]} Farm ${i + 1}`,
        location: `${f.region} Region`,
        hectares: 4 + i * 3,
        crops: f.crops,
        status: 'active' as const,
      })),
      documents: [
        {
          id: 'd1',
          name: 'Ghana Card',
          uploadedAt: f.joinedAt,
          status: f.kyc === 'approved' ? 'approved' : 'pending',
        },
        {
          id: 'd2',
          name: 'Farm ownership certificate',
          uploadedAt: f.joinedAt,
          status: f.kyc === 'approved' ? 'approved' : 'pending',
        },
      ],
    };
  }

  create(v: FarmerFormValue): Farmer {
    const n = this._farmers().length + 1;
    const farmer: Farmer = {
      ...v,
      id: String(Date.now()),
      code: `F-${String(n).padStart(3, '0')}`,
      status: 'pending',
      kyc: 'pending',
      farms: 0,
      rating: null,
      revenue: null,
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    this._farmers.update((l) => [farmer, ...l]);
    return farmer;
  }

  update(id: string, v: FarmerFormValue) {
    this.patch(id, v);
  }
  approve(id: string) {
    this.patch(id, { status: 'verified', kyc: 'approved', statusReason: undefined });
  }
  reject(id: string, reason: string) {
    this.patch(id, { status: 'rejected', kyc: 'rejected', statusReason: reason });
  }
  suspend(id: string, reason: string) {
    this.patch(id, { status: 'suspended', statusReason: reason });
  }
  reinstate(id: string) {
    this.patch(id, { status: 'verified', statusReason: undefined });
  }

  private patch(id: string, changes: Partial<Farmer>) {
    this._farmers.update((l) => l.map((f) => (f.id === id ? { ...f, ...changes } : f)));
  }
}
