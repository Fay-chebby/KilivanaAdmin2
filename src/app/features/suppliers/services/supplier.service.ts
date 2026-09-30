import { Injectable, signal } from '@angular/core';
import { Supplier, SupplierFormValue } from '../models/supplier.model';

const STORAGE_KEY = 'agriadmin.suppliers';

const SEED: Supplier[] = [
  {
    id: '1',
    code: 'S-001',
    username: 'agroinput',
    name: 'AgroInput Ghana',
    category: 'Fertilizers & Seeds',
    contactPerson: 'Kofi Boateng',
    email: 'info@agroinput.gh',
    phone: '0244123456',
    region: 'Greater Accra',
    address: 'Tema Industrial Area',
    contractEnd: '2025-12-31',
    status: 'active',
    suspensionReason: null,
    productsCount: 34,
    rating: 4.6,
    createdAt: '2024-01-10',
  },
  {
    id: '2',
    code: 'S-002',
    username: 'farmmech',
    name: 'FarmMech Ltd',
    category: 'Equipment & Machinery',
    contactPerson: 'Ama Serwaa',
    email: 'sales@farmmech.com',
    phone: '0201234567',
    region: 'Ashanti',
    address: 'Kumasi, Suame',
    contractEnd: '2025-06-30',
    status: 'active',
    suspensionReason: null,
    productsCount: 18,
    rating: 4.8,
    createdAt: '2024-02-14',
  },
  {
    id: '3',
    code: 'S-003',
    username: 'pestcontrol',
    name: 'PestControl Pro',
    category: 'Pesticides',
    contactPerson: 'Yaw Mensah',
    email: 'hello@pestcontrolpro.com',
    phone: '0553456789',
    region: 'Northern',
    address: 'Tamale',
    contractEnd: '2024-09-30',
    status: 'suspended',
    suspensionReason: 'Expired licence documents',
    productsCount: 12,
    rating: 3.2,
    createdAt: '2024-03-02',
  },
  {
    id: '4',
    code: 'S-004',
    username: 'seedbank',
    name: 'SeedBank Ghana',
    category: 'Seeds',
    contactPerson: 'Efua Owusu',
    email: 'contact@seedbank.gh',
    phone: '0277654321',
    region: 'Eastern',
    address: 'Koforidua',
    contractEnd: '2026-03-31',
    status: 'active',
    suspensionReason: null,
    productsCount: 67,
    rating: 4.9,
    createdAt: '2024-03-20',
  },
  {
    id: '5',
    code: 'S-005',
    username: 'irritech',
    name: 'IrriTech Systems',
    category: 'Irrigation',
    contactPerson: 'Kwame Asante',
    email: 'support@irritech.com',
    phone: '0500112233',
    region: 'Volta',
    address: 'Ho',
    contractEnd: null,
    status: 'pending',
    suspensionReason: null,
    productsCount: 8,
    rating: null,
    createdAt: '2024-04-05',
  },
];

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly _suppliers = signal<Supplier[]>(this.load());
  readonly suppliers = this._suppliers.asReadonly();

  /** Simple feedback message shown on the list page. Swap for your ToastService if you like. */
  readonly notice = signal<string | null>(null);
  private noticeTimer?: ReturnType<typeof setTimeout>;

  getById(id: string): Supplier | undefined {
    return this._suppliers().find((s) => s.id === id);
  }

  usernameTaken(username: string, excludeId?: string): boolean {
    const u = username.trim().toLowerCase();
    return this._suppliers().some(
      (s) => s.id !== excludeId && (s.username ?? '').toLowerCase() === u,
    );
  }

  create(value: SupplierFormValue): Supplier {
    // NOTE: value.password is intentionally NOT stored. With a real backend, send it
    // to the API over HTTPS and let the server hash it.
    const list = this._suppliers();
    const next =
      list.reduce((max, s) => Math.max(max, parseInt(s.code.replace('S-', ''), 10) || 0), 0) + 1;
    const supplier: Supplier = {
      id: crypto.randomUUID(),
      code: `S-${String(next).padStart(3, '0')}`,
      name: value.name.trim(),
      username: value.username.trim(),
      category: value.category,
      contactPerson: value.contactPerson.trim(),
      email: value.email.trim(),
      phone: value.phone.trim(),
      region: value.region.trim(),
      address: value.address.trim(),
      contractEnd: value.contractEnd || null,
      status: value.status,
      suspensionReason: null,
      productsCount: 0,
      rating: null,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this.commit([supplier, ...list]);
    this.flash(`${supplier.name} registered successfully.`);
    return supplier;
  }

  update(id: string, value: SupplierFormValue): void {
    this.commit(
      this._suppliers().map((s) =>
        s.id === id
          ? {
              ...s,
              name: value.name.trim(),
              username: value.username.trim(),
              category: value.category,
              contactPerson: value.contactPerson.trim(),
              email: value.email.trim(),
              phone: value.phone.trim(),
              region: value.region.trim(),
              address: value.address.trim(),
              contractEnd: value.contractEnd || null,
            }
          : s,
      ),
    );
    this.flash('Supplier updated successfully.');
  }

  delete(id: string): void {
    const name = this.getById(id)?.name ?? 'Supplier';
    this.commit(this._suppliers().filter((s) => s.id !== id));
    this.flash(`${name} was deleted.`);
  }

  suspend(id: string, reason: string): void {
    this.patch(id, { status: 'suspended', suspensionReason: reason });
    this.flash('Supplier suspended.');
  }

  /** Used for both "Reinstate" (suspended → active) and "Activate" (pending → active) */
  activate(id: string): void {
    this.patch(id, { status: 'active', suspensionReason: null });
    this.flash('Supplier is now active.');
  }

  // ---- internals ----
  private patch(id: string, changes: Partial<Supplier>): void {
    this.commit(this._suppliers().map((s) => (s.id === id ? { ...s, ...changes } : s)));
  }

  private commit(list: Supplier[]): void {
    this._suppliers.set(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }

  private load(): Supplier[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Supplier[]) : SEED;
    } catch {
      return SEED;
    }
  }

  private flash(message: string): void {
    clearTimeout(this.noticeTimer);
    this.notice.set(message);
    this.noticeTimer = setTimeout(() => this.notice.set(null), 3500);
  }
}
