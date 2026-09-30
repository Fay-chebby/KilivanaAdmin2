import { Injectable, signal } from '@angular/core';
import { Driver, DriverFormValue, KycStatus } from '../models/driver.model';

const STORAGE_KEY = 'agriadmin.drivers';

const SEED: Driver[] = [
  {
    id: '1',
    code: 'DA-001',
    fullName: 'Samuel Boadu',
    username: 'samuel.boadu',
    phone: '0244111222',
    email: 'samuel@agriadmin.com',
    region: 'Greater Accra',
    address: 'Tema, Community 4',
    status: 'on-delivery',
    suspensionReason: null,
    idType: 'Ghana Card',
    idNumber: 'GHA-712345678-1',
    licenceNumber: 'DL-100234',
    licenceExpiry: '2027-08-15',
    kycStatus: 'verified',
    vehicle: { type: 'Truck', capacity: '5T', plateNumber: 'GR-1234-22', make: 'Isuzu' },
    activeDelivery: 'ORD-2847',
    totalDeliveries: 234,
    rating: 4.6,
    createdAt: '2024-01-12',
  },
  {
    id: '2',
    code: 'DA-002',
    fullName: 'Comfort Aidoo',
    username: 'comfort.aidoo',
    phone: '0201333444',
    email: 'comfort@agriadmin.com',
    region: 'Ashanti',
    address: 'Kumasi, Adum',
    status: 'available',
    suspensionReason: null,
    idType: 'Ghana Card',
    idNumber: 'GHA-723456789-2',
    licenceNumber: 'DL-100567',
    licenceExpiry: '2026-11-30',
    kycStatus: 'verified',
    vehicle: { type: 'Van', capacity: '2T', plateNumber: 'AS-5678-21', make: 'Toyota Hiace' },
    activeDelivery: null,
    totalDeliveries: 189,
    rating: 4.8,
    createdAt: '2024-02-03',
  },
  {
    id: '3',
    code: 'DA-003',
    fullName: 'Michael Tawiah',
    username: 'michael.tawiah',
    phone: '0553555666',
    email: 'michael@agriadmin.com',
    region: 'Northern',
    address: 'Tamale, Lamashegu',
    status: 'on-delivery',
    suspensionReason: null,
    idType: 'Voter ID',
    idNumber: 'VID-4455667788',
    licenceNumber: 'DL-100890',
    licenceExpiry: '2027-03-01',
    kycStatus: 'verified',
    vehicle: { type: 'Truck', capacity: '10T', plateNumber: 'NR-9012-20', make: 'MAN' },
    activeDelivery: 'ORD-2851',
    totalDeliveries: 312,
    rating: 4.4,
    createdAt: '2024-02-20',
  },
  {
    id: '4',
    code: 'DA-004',
    fullName: 'Grace Asiedu',
    username: 'grace.asiedu',
    phone: '0277777888',
    email: 'grace@agriadmin.com',
    region: 'Eastern',
    address: 'Koforidua, Effiduase',
    status: 'offline',
    suspensionReason: null,
    idType: 'Ghana Card',
    idNumber: 'GHA-734567890-3',
    licenceNumber: 'DL-101122',
    licenceExpiry: '2026-12-20',
    kycStatus: 'pending',
    vehicle: { type: 'Van', capacity: '2T', plateNumber: 'ER-3456-23', make: 'Nissan NV200' },
    activeDelivery: null,
    totalDeliveries: 97,
    rating: 4.2,
    createdAt: '2024-03-15',
  },
];

export interface Notice {
  text: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class DriverService {
  private readonly _drivers = signal<Driver[]>(this.load());
  readonly drivers = this._drivers.asReadonly();

  /** Feedback message. Swap for your ToastService if you like. */
  readonly notice = signal<Notice | null>(null);
  private noticeTimer?: ReturnType<typeof setTimeout>;

  getById(id: string): Driver | undefined {
    return this._drivers().find((d) => d.id === id);
  }

  /** Drivers on an active delivery can't be suspended or deleted */
  isLocked(d: Driver): boolean {
    return d.status === 'on-delivery';
  }

  usernameTaken(username: string, excludeId?: string): boolean {
    const u = username.trim().toLowerCase();
    return this._drivers().some(
      (d) => d.id !== excludeId && (d.username ?? '').toLowerCase() === u,
    );
  }

  plateTaken(plate: string, excludeId?: string): boolean {
    const p = plate.trim().toUpperCase();
    return this._drivers().some(
      (d) => d.id !== excludeId && d.vehicle.plateNumber.toUpperCase() === p,
    );
  }

  create(value: DriverFormValue): Driver {
    // NOTE: value.password is intentionally NOT stored. With a real backend, send it
    // to the API over HTTPS and let the server hash it.
    const list = this._drivers();
    const next =
      list.reduce((m, d) => Math.max(m, parseInt(d.code.replace('DA-', ''), 10) || 0), 0) + 1;
    const driver: Driver = {
      id: crypto.randomUUID(),
      code: `DA-${String(next).padStart(3, '0')}`,
      ...this.fromForm(value),
      status: 'offline',
      suspensionReason: null,
      activeDelivery: null,
      totalDeliveries: 0,
      rating: null,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this.commit([driver, ...list]);
    this.flash(`${driver.fullName} registered successfully.`);
    return driver;
  }

  update(id: string, value: DriverFormValue): void {
    this.commit(this._drivers().map((d) => (d.id === id ? { ...d, ...this.fromForm(value) } : d)));
    this.flash('Driver updated successfully.');
  }

  delete(id: string): boolean {
    const d = this.getById(id);
    if (!d) return false;
    if (this.isLocked(d)) return this.blocked(d, 'deleted');
    this.commit(this._drivers().filter((x) => x.id !== id));
    this.flash(`${d.fullName} was deleted.`);
    return true;
  }

  suspend(id: string, reason: string): boolean {
    const d = this.getById(id);
    if (!d) return false;
    if (this.isLocked(d)) return this.blocked(d, 'suspended');
    this.patch(id, { status: 'suspended', suspensionReason: reason });
    this.flash(`${d.fullName} suspended.`);
    return true;
  }

  /** Reinstate: suspended → offline (the driver goes online from their own app) */
  activate(id: string): void {
    this.patch(id, { status: 'offline', suspensionReason: null });
    this.flash('Driver reinstated.');
  }

  setKyc(id: string, kycStatus: KycStatus): void {
    this.patch(id, { kycStatus });
    this.flash(kycStatus === 'verified' ? 'KYC marked as verified.' : 'KYC marked as pending.');
  }

  // ---- internals ----
  private fromForm(v: DriverFormValue) {
    return {
      fullName: v.fullName.trim(),
      username: v.username.trim(),
      phone: v.phone.trim(),
      email: v.email.trim(),
      region: v.region,
      address: v.address.trim(),
      idType: v.idType,
      idNumber: v.idNumber.trim(),
      licenceNumber: v.licenceNumber.trim(),
      licenceExpiry: v.licenceExpiry,
      kycStatus: v.kycStatus,
      vehicle: {
        type: v.vehicleType,
        capacity: v.vehicleCapacity.trim(),
        plateNumber: v.plateNumber.trim().toUpperCase(),
        make: v.vehicleMake.trim(),
      },
    };
  }

  private blocked(d: Driver, action: string): false {
    this.flash(`${d.fullName} is on an active delivery and can't be ${action} right now.`, 'error');
    return false;
  }

  private patch(id: string, changes: Partial<Driver>): void {
    this.commit(this._drivers().map((d) => (d.id === id ? { ...d, ...changes } : d)));
  }

  private commit(list: Driver[]): void {
    this._drivers.set(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }

  private load(): Driver[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Driver[]) : SEED;
    } catch {
      return SEED;
    }
  }

  private flash(text: string, type: Notice['type'] = 'success'): void {
    clearTimeout(this.noticeTimer);
    this.notice.set({ text, type });
    this.noticeTimer = setTimeout(() => this.notice.set(null), 3500);
  }
}
