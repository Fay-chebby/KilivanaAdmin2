import { Injectable, computed, signal } from '@angular/core';
import { KycApplication, KycDocument, KycResult, isOpen, unviewedCount } from '../models/kyc.model';

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const docs = (...names: string[]): KycDocument[] =>
  names.map((name, i) => ({
    id: `doc-${i + 1}`,
    name,
    fileType: /id|photo/i.test(name) ? 'image' : 'pdf',
    viewed: false,
  }));

const SEED: KycApplication[] = [
  {
    id: 'VQ-001',
    name: 'Wanjiku Kamau',
    type: 'farmer',
    email: 'wanjiku.kamau@example.com',
    phone: '+254712345678',
    county: 'Nakuru',
    priority: 'normal',
    status: 'pending',
    submittedAt: daysAgo(5),
    documents: docs('National ID', 'Farm Certificate', 'KRA PIN Certificate', 'Bank Statement'),
  },
  {
    id: 'VQ-002',
    name: 'FreshPak Exports',
    type: 'buyer',
    email: 'accounts@freshpak.example.com',
    phone: '+254722456789',
    county: 'Mombasa',
    priority: 'high',
    status: 'under_review',
    submittedAt: daysAgo(4),
    documents: docs(
      'Certificate of Incorporation',
      'KRA PIN Certificate',
      'Business Permit',
      'Director ID',
      'Bank Statement',
      'Import Licence',
    ),
  },
  {
    id: 'VQ-003',
    name: 'IrriTech Systems',
    type: 'supplier',
    email: 'info@irritech.example.com',
    phone: '+254733567890',
    county: 'Nairobi',
    priority: 'normal',
    status: 'pending',
    submittedAt: daysAgo(3),
    documents: docs(
      'Certificate of Incorporation',
      'KRA PIN Certificate',
      'Business Permit',
      'Tax Compliance Certificate',
      'Product Catalogue',
      'Bank Statement',
      'Director ID',
      'Insurance Cover',
    ),
  },
  {
    id: 'VQ-004',
    name: 'Fatuma Hassan',
    type: 'farmer',
    email: 'fatuma.hassan@example.com',
    phone: '+254744678901',
    county: 'Meru',
    priority: 'high',
    status: 'pending',
    submittedAt: daysAgo(10),
    documents: docs('National ID', 'Farm Certificate', 'Bank Statement'),
  },
  {
    id: 'VQ-005',
    name: 'Kipchoge Rotich',
    type: 'inspector',
    email: 'k.rotich@example.com',
    phone: '+254755789012',
    county: 'Uasin Gishu',
    priority: 'normal',
    status: 'pending',
    submittedAt: daysAgo(2),
    documents: docs(
      'National ID',
      'Agronomy Certificate',
      'Inspector Licence',
      'Good Conduct Certificate',
      'Passport Photo',
    ),
  },
];

@Injectable({ providedIn: 'root' })
export class KycService {
  private _items = signal<KycApplication[]>(SEED);

  readonly items = this._items.asReadonly();
  readonly stats = computed(() => {
    const open = this._items().filter(isOpen);
    const n = (...t: string[]) => open.filter((a) => t.includes(a.type)).length;
    return {
      total: open.length,
      pending: this._items().filter((a) => a.status === 'pending').length,
      farmers: n('farmer'),
      buyers: n('buyer'),
      suppliersInspectors: n('supplier', 'inspector'),
    };
  });

  get(id: string) {
    return this._items().find((a) => a.id === id);
  }

  /** Admin opens a document. It is marked viewed, and a pending application moves to under review. */
  openDocument(appId: string, docId: string) {
    this.patch(appId, (a) =>
      a.decision
        ? a
        : {
            ...a,
            status: a.status === 'pending' ? 'under_review' : a.status,
            documents: a.documents.map((d) => (d.id === docId ? { ...d, viewed: true } : d)),
          },
    );
  }

  approve(id: string): KycResult {
    const a = this.get(id);
    if (!a) return fail('Application not found.');
    if (!isOpen(a)) return fail('This application was already decided.');
    const left = unviewedCount(a);
    if (left)
      return fail(
        `Open ${left === 1 ? 'the remaining document' : `the remaining ${left} documents`} before approving.`,
      );
    this.patch(id, (x) => ({
      ...x,
      status: 'approved',
      decision: { status: 'approved', at: new Date().toISOString() },
    }));
    // TODO real API: mark the farmer/buyer/supplier/inspector as verified here.
    return { ok: true, message: `${a.name} was approved.` };
  }

  reject(id: string, reason: string): KycResult {
    const a = this.get(id);
    if (!a) return fail('Application not found.');
    if (!isOpen(a)) return fail('This application was already decided.');
    const why = reason.trim();
    if (why.length < 10)
      return fail('Write a reason of at least 10 characters. The applicant will see it.');
    this.patch(id, (x) => ({
      ...x,
      status: 'rejected',
      decision: { status: 'rejected', at: new Date().toISOString(), reason: why },
    }));
    return { ok: true, message: `${a.name} was rejected.` };
  }

  private patch(id: string, fn: (a: KycApplication) => KycApplication) {
    this._items.update((l) => l.map((a) => (a.id === id ? fn(a) : a)));
  }
}

const fail = (message: string): KycResult => ({ ok: false, message });
