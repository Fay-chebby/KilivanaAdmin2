import { Injectable, computed, signal } from '@angular/core';
import {
  FarmAssignment,
  FarmPhoto,
  Inspector,
  InspectorCreatePayload,
  InspectorPayload,
  SEED_KYC,
  VerificationStatus,
} from '../models/inspector.model';

/**
 * In-memory implementation so everything works today.
 * When your API is ready, replace the bodies with HttpClient calls
 * (keep the method names and the components won't change).
 */
@Injectable({ providedIn: 'root' })
export class InspectorService {
  private readonly _inspectors = signal<Inspector[]>([
    {
      id: '1',
      code: 'I-001',
      name: 'Dr. Wambui Njoroge',
      email: 'w.njoroge@agri.co.ke',
      phone: '0712000001',
      specialization: 'Tea & Coffee',
      region: 'Kiambu',
      status: 'active',
      pending: 0,
      completed: 127,
      passRate: 91,
      rating: 4.7,
      createdAt: '2025-01-10',
      mustChangePassword: false,
      kyc: { ...SEED_KYC },
    },
    {
      id: '2',
      code: 'I-002',
      name: 'Brian Kiprop',
      email: 'b.kiprop@agri.co.ke',
      phone: '0722000002',
      specialization: 'Grains & Cereals',
      region: 'Uasin Gishu',
      status: 'active',
      pending: 0,
      completed: 84,
      passRate: 88,
      rating: 4.5,
      createdAt: '2025-02-03',
      mustChangePassword: false,
      kyc: { ...SEED_KYC },
    },
    {
      id: '3',
      code: 'I-003',
      name: 'Faith Achieng',
      email: 'f.achieng@agri.co.ke',
      phone: '0733000003',
      specialization: 'Vegetables & Horticulture',
      region: 'Kisumu',
      status: 'active',
      pending: 0,
      completed: 63,
      passRate: 94,
      rating: 4.9,
      createdAt: '2025-03-15',
      mustChangePassword: false,
      kyc: { ...SEED_KYC },
    },
    {
      id: '4',
      code: 'I-004',
      name: 'Peter Mutua',
      email: 'p.mutua@agri.co.ke',
      phone: '0700000004',
      specialization: 'Root Crops',
      region: 'Nyeri',
      status: 'on_leave',
      pending: 0,
      completed: 48,
      passRate: 86,
      rating: 4.3,
      createdAt: '2025-04-01',
      mustChangePassword: false,
      kyc: { ...SEED_KYC },
    },
  ]);

  private readonly _assignments = signal<FarmAssignment[]>([
    {
      id: 'a1',
      inspectorId: '1',
      farmerName: 'Wanjiru Kamau',
      farmName: 'Kamau Tea Estate',
      location: 'Limuru, Kiambu',
      crop: 'Tea',
      sizeAcres: 12,
      dueDate: '2026-10-08',
      status: 'pending',
      notes: '',
      photos: [],
    },
    {
      id: 'a2',
      inspectorId: '1',
      farmerName: 'Achieng Otieno',
      farmName: 'Otieno Lakeside Farm',
      location: 'Nyando, Kisumu',
      crop: 'Tea',
      sizeAcres: 8,
      dueDate: '2026-10-12',
      status: 'pending',
      notes: '',
      photos: [],
    },
    {
      id: 'a3',
      inspectorId: '2',
      farmerName: 'Hassan Abdi',
      farmName: 'Abdi Maize Farm',
      location: 'Eldoret, Uasin Gishu',
      crop: 'Maize',
      sizeAcres: 25,
      dueDate: '2026-10-05',
      status: 'pending',
      notes: '',
      photos: [],
    },
    {
      id: 'a4',
      inspectorId: '3',
      farmerName: 'Njeri Mwangi',
      farmName: 'Green Rows',
      location: 'Kiambu Town, Kiambu',
      crop: 'Tomatoes',
      sizeAcres: 3,
      dueDate: '2026-10-02',
      status: 'verified',
      notes: 'Farm confirmed, matches registration.',
      photos: [],
    },
  ]);

  readonly inspectors = this._inspectors.asReadonly();
  readonly assignments = this._assignments.asReadonly();

  readonly stats = computed(() => {
    const list = this._inspectors();
    return {
      total: list.length,
      active: list.filter((i) => i.status === 'active').length,
      suspended: list.filter((i) => i.status === 'suspended').length,
      pending: this._assignments().filter((a) => a.status === 'pending').length,
    };
  });

  getById(id: string) {
    return this._inspectors().find((i) => i.id === id);
  }

  assignmentsFor(inspectorId: string) {
    return this._assignments().filter((a) => a.inspectorId === inspectorId);
  }

  create(payload: InspectorCreatePayload): Inspector {
    // Real API: send temporaryPassword to the backend (it must hash it and
    // notify the inspector). Never store or return it in plain text.
    const { temporaryPassword, idSighted, kyc, ...basic } = payload;
    void temporaryPassword;
    const n = this._inspectors().length + 1;
    const inspector: Inspector = {
      ...basic,
      id: crypto.randomUUID(),
      code: `I-${String(n).padStart(3, '0')}`,
      pending: 0,
      completed: 0,
      passRate: 0,
      rating: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      mustChangePassword: true,
      kyc: { ...kyc, verifiedAt: idSighted ? new Date().toISOString().slice(0, 10) : null },
    };
    this._inspectors.update((l) => [...l, inspector]);
    return inspector;
  }

  update(id: string, payload: InspectorPayload) {
    const { idSighted, kyc, ...basic } = payload;
    this._inspectors.update((l) =>
      l.map((i) =>
        i.id === id
          ? {
              ...i,
              ...basic,
              kyc: {
                ...i.kyc,
                ...kyc,
                verifiedAt: idSighted
                  ? (i.kyc.verifiedAt ?? new Date().toISOString().slice(0, 10))
                  : null,
              },
            }
          : i,
      ),
    );
  }

  /** 12 random characters, no look-alikes (0/O, 1/l/I) */
  generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
  }

  /** Issues a new temporary password; the inspector must change it on next sign-in */
  resetPassword(id: string): string {
    const pw = this.generatePassword();
    this._inspectors.update((l) =>
      l.map((i) => (i.id === id ? { ...i, mustChangePassword: true } : i)),
    );
    return pw; // Real API: POST /inspectors/:id/reset-password
  }

  remove(id: string) {
    this._inspectors.update((l) => l.filter((i) => i.id !== id));
    this._assignments.update((l) => l.filter((a) => a.inspectorId !== id));
  }

  suspend(id: string, reason: string) {
    this._inspectors.update((l) =>
      l.map((i) => (i.id === id ? { ...i, status: 'suspended', suspendReason: reason } : i)),
    );
  }

  reactivate(id: string) {
    this._inspectors.update((l) =>
      l.map((i) => (i.id === id ? { ...i, status: 'active', suspendReason: undefined } : i)),
    );
  }

  /** Live counts so list/detail always agree with the assignments */
  pendingFor(inspectorId: string) {
    return this._assignments().filter(
      (a) => a.inspectorId === inspectorId && a.status === 'pending',
    ).length;
  }

  completedFor(inspector: Inspector) {
    const done = this._assignments().filter(
      (a) => a.inspectorId === inspector.id && a.status !== 'pending',
    ).length;
    return inspector.completed + done;
  }

  // ---------- farm verification ----------
  addPhotos(assignmentId: string, photos: FarmPhoto[]) {
    this._assignments.update((l) =>
      l.map((a) => (a.id === assignmentId ? { ...a, photos: [...a.photos, ...photos] } : a)),
    );
  }

  removePhoto(assignmentId: string, photoId: string) {
    this._assignments.update((l) =>
      l.map((a) =>
        a.id === assignmentId ? { ...a, photos: a.photos.filter((p) => p.id !== photoId) } : a,
      ),
    );
  }

  submitVerification(assignmentId: string, status: VerificationStatus, notes: string) {
    this._assignments.update((l) =>
      l.map((a) => (a.id === assignmentId ? { ...a, status, notes } : a)),
    );
  }
}
