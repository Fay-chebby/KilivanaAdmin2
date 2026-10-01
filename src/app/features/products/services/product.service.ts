import { Injectable, computed, signal } from '@angular/core';
import {
  DEFAULT_CHECKLIST,
  Grade,
  Product,
  ProductImage,
  ProductPayload,
  ProductVerification,
  visibility,
  stockState,
} from '../models/product.model';

const today = () => new Date().toISOString().slice(0, 10);

/** Soft produce-style picture so demo products have photos */
function pic(i: number): string {
  const bg = [
    ['#fde9c9', '#fff6e6'],
    ['#d9efd5', '#f1f9ee'],
    ['#f6d8d3', '#fdf0ee'],
    ['#d8e6f3', '#eff5fb'],
  ][i % 4];
  const c = ['#c8832b', '#2f8f4e', '#c0432f', '#3b76b8'][i % 4];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${bg[0]}'/><stop offset='1' stop-color='${bg[1]}'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/><ellipse cx='200' cy='235' rx='140' ry='22' fill='#000' opacity='.07'/><path d='M80 150 Q200 70 320 150 L300 235 Q200 260 100 235Z' fill='${c}'/><circle cx='150' cy='155' r='24' fill='#fff' opacity='.25'/><circle cx='215' cy='140' r='20' fill='#fff' opacity='.2'/><circle cx='265' cy='170' r='22' fill='#fff' opacity='.22'/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
const im = (i: number, caption: string, by: 'farmer' | 'inspector' = 'farmer'): ProductImage => ({
  id: crypto.randomUUID(),
  url: pic(i),
  caption,
  uploadedBy: by,
  uploadedAt: '2026-09-18',
});

const fresh = (): ProductVerification => ({
  status: 'unassigned',
  inspectorId: null,
  inspectorName: null,
  assignedAt: null,
  dueDate: null,
  notes: '',
  checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c })),
  verifiedQty: null,
  decidedAt: null,
});
const allOk = (qty: number, by: string, id: string, notes: string): ProductVerification => ({
  ...fresh(),
  status: 'approved',
  inspectorId: id,
  inspectorName: by,
  assignedAt: '2026-09-01',
  dueDate: '2026-09-08',
  notes,
  checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c, checked: true })),
  verifiedQty: qty,
  decidedAt: '2026-09-07',
});

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly _products = signal<Product[]>([
    {
      id: 'p1',
      code: 'P-001',
      name: 'Kamau Estate Black Tea (CTC)',
      category: 'Coffee & Tea',
      description: 'Black CTC tea from the Limuru highlands, picked and processed within 24 hours.',
      sellerName: 'Wanjiru Kamau',
      sellerType: 'farmer',
      sellerPhone: '0712345001',
      county: 'Kiambu',
      farmId: 'f1',
      priceKes: 450,
      unit: 'kg',
      stock: 1800,
      minOrder: 5,
      lowStockAt: 200,
      quality: 'Grade A',
      harvestDate: '2026-09-10',
      status: 'active',
      createdAt: '2026-08-28',
      verifiedAt: '2026-09-07',
      images: [
        im(1, 'Tea packed in sacks'),
        im(0, 'Drying floor'),
        im(1, 'Inspector: stock count', 'inspector'),
      ],
      verification: allOk(
        1800,
        'Dr. Wambui Njoroge',
        '1',
        'Stock counted and quality sampled. All good.',
      ),
    },
    {
      id: 'p2',
      code: 'P-002',
      name: 'Dried Maize',
      category: 'Cereals & Grains',
      description: 'Sun-dried white maize, shelled and sorted. Moisture below 13.5%.',
      sellerName: 'Kiprono Cheruiyot',
      sellerType: 'farmer',
      sellerPhone: '0722345002',
      county: 'Uasin Gishu',
      farmId: 'f2',
      priceKes: 60,
      unit: 'kg',
      stock: 12000,
      minOrder: 90,
      lowStockAt: 1000,
      quality: 'Grade B',
      harvestDate: '2026-08-30',
      status: 'active',
      createdAt: '2026-09-01',
      verifiedAt: '2026-09-09',
      images: [im(0, 'Maize in the store'), im(2, 'Bagged maize')],
      verification: allOk(12000, 'Brian Kiprop', '2', 'Store visited. Quantity confirmed.'),
    },
    {
      id: 'p3',
      code: 'P-003',
      name: 'Hass Avocados',
      category: 'Fruits',
      description: 'Export-quality Hass avocados, graded by size and picked at the right maturity.',
      sellerName: 'Wanjiru Kamau',
      sellerType: 'farmer',
      sellerPhone: '0712345001',
      county: 'Kiambu',
      farmId: 'f1',
      priceKes: 85,
      unit: 'kg',
      stock: 2200,
      minOrder: 20,
      lowStockAt: 300,
      quality: 'Export',
      harvestDate: '2026-09-20',
      status: 'active',
      createdAt: '2026-09-12',
      verifiedAt: '2026-09-18',
      images: [
        im(1, 'Avocados in crates'),
        im(2, 'Orchard rows'),
        im(1, 'Inspector: sample check', 'inspector'),
      ],
      verification: allOk(2200, 'Dr. Wambui Njoroge', '1', 'Fruit sampled from five crates.'),
    },
    {
      id: 'p4',
      code: 'P-004',
      name: 'Macadamia Nuts (in shell)',
      category: 'Nuts & Seeds',
      description: 'Dried in-shell macadamia from smallholder members.',
      sellerName: 'Meru Nut Growers Co-op',
      sellerType: 'supplier',
      sellerPhone: '0733345007',
      county: 'Meru',
      farmId: null,
      priceKes: 140,
      unit: 'kg',
      stock: 0,
      minOrder: 25,
      lowStockAt: 200,
      quality: 'Export',
      harvestDate: '2026-07-22',
      status: 'active',
      createdAt: '2026-07-30',
      verifiedAt: '2026-08-05',
      images: [im(0, 'Nuts drying')],
      verification: allOk(3000, 'Faith Achieng', '3', 'Warehouse stock verified.'),
    },
    {
      id: 'p5',
      code: 'P-005',
      name: 'Fresh Tomatoes',
      category: 'Vegetables',
      description: 'Vine-ripened tomatoes in 60 kg crates.',
      sellerName: 'Njeri Mwangi',
      sellerType: 'farmer',
      sellerPhone: '0744345008',
      county: 'Kiambu',
      farmId: null,
      priceKes: 3200,
      unit: 'crate',
      stock: 40,
      minOrder: 2,
      lowStockAt: 10,
      quality: 'Grade B',
      harvestDate: '2026-09-25',
      status: 'suspended',
      suspendReason: 'Two buyers reported damaged fruit on delivery.',
      createdAt: '2026-09-02',
      verifiedAt: '2026-09-05',
      images: [im(2, 'Tomato crates')],
      verification: allOk(40, 'Faith Achieng', '3', 'Fresh stock confirmed.'),
    },
    {
      id: 'p6',
      code: 'P-006',
      name: 'Mwea Pishori Rice',
      category: 'Cereals & Grains',
      description: 'Aromatic Pishori rice from the Mwea irrigation scheme, milled and graded.',
      sellerName: 'Mwea Rice Growers',
      sellerType: 'supplier',
      sellerPhone: '0755345009',
      county: 'Kirinyaga',
      farmId: null,
      priceKes: 180,
      unit: 'kg',
      stock: 3500,
      minOrder: 10,
      lowStockAt: 300,
      quality: 'Grade A',
      harvestDate: '2026-09-15',
      status: 'pending',
      createdAt: '2026-09-29',
      verifiedAt: null,
      images: [im(3, 'Rice in 50 kg sacks'), im(3, 'Mill warehouse')],
      verification: fresh(),
    },
    {
      id: 'p7',
      code: 'P-007',
      name: 'Rosecoco Beans',
      category: 'Legumes & Pulses',
      description: 'Dry rosecoco beans, hand-sorted and free from stones.',
      sellerName: 'Mutua Musyoka',
      sellerType: 'farmer',
      sellerPhone: '0720345006',
      county: 'Kitui',
      farmId: 'f6',
      priceKes: 150,
      unit: 'kg',
      stock: 900,
      minOrder: 10,
      lowStockAt: 100,
      quality: 'Grade B',
      harvestDate: '2026-09-05',
      status: 'pending',
      createdAt: '2026-09-27',
      verifiedAt: null,
      images: [im(2, 'Beans in sacks'), im(0, 'Drying yard')],
      verification: {
        ...fresh(),
        status: 'in_review',
        inspectorId: '2',
        inspectorName: 'Brian Kiprop',
        assignedAt: '2026-09-28',
        dueDate: '2026-10-03',
        checklist: DEFAULT_CHECKLIST.map((c, i) => ({ ...c, checked: i < 2 })),
      },
    },
    {
      id: 'p8',
      code: 'P-008',
      name: 'Sweet Potatoes',
      category: 'Roots & Tubers',
      description: 'Orange-fleshed sweet potatoes, freshly dug.',
      sellerName: 'Achieng Otieno',
      sellerType: 'farmer',
      sellerPhone: '0733345003',
      county: 'Kisumu',
      farmId: 'f3',
      priceKes: 45,
      unit: 'kg',
      stock: 5000,
      minOrder: 20,
      lowStockAt: 500,
      quality: 'Grade C',
      harvestDate: '2026-09-14',
      status: 'rejected',
      createdAt: '2026-09-16',
      verifiedAt: null,
      images: [im(1, 'Sweet potato heap')],
      verification: {
        ...fresh(),
        status: 'rejected',
        inspectorId: '3',
        inspectorName: 'Faith Achieng',
        assignedAt: '2026-09-18',
        dueDate: '2026-09-25',
        notes:
          'Only about 600 kg found on site against 5,000 kg listed. Correct the quantity and resubmit.',
        checklist: DEFAULT_CHECKLIST.map((c, i) => ({ ...c, checked: i !== 1 })),
        verifiedQty: 600,
        decidedAt: '2026-09-24',
      },
    },
  ]);

  readonly products = this._products.asReadonly();

  readonly stats = computed(() => {
    const l = this._products();
    const live = l.filter((p) => visibility(p).live);
    return {
      total: l.length,
      live: live.length,
      liveValue: live.reduce((a, p) => a + p.priceKes * p.stock, 0),
      pending: l.filter((p) => p.status === 'pending').length,
      restock: l.filter((p) => p.status === 'active' && stockState(p) !== 'ok').length,
    };
  });

  getById(id: string) {
    return this._products().find((p) => p.id === id);
  }

  private patch(id: string, fn: (p: Product) => Product) {
    this._products.update((l) => l.map((p) => (p.id === id ? fn(p) : p)));
  }
  private patchV(id: string, fn: (v: ProductVerification) => Partial<ProductVerification>) {
    this.patch(id, (p) => ({ ...p, verification: { ...p.verification, ...fn(p.verification) } }));
  }

  /** New products always start as pending: customers can't see them until verified */
  create(payload: ProductPayload): Product {
    const { sellerImages, ...rest } = payload;
    const p: Product = {
      ...rest,
      id: crypto.randomUUID(),
      code: `P-${String(this._products().length + 1).padStart(3, '0')}`,
      status: 'pending',
      images: sellerImages,
      verification: fresh(),
      verifiedAt: null,
      createdAt: today(),
    };
    this._products.update((l) => [...l, p]);
    return p;
  }

  update(id: string, payload: ProductPayload) {
    const { sellerImages, ...rest } = payload;
    this.patch(id, (p) => ({
      ...p,
      ...rest,
      images: [...sellerImages, ...p.images.filter((i) => i.uploadedBy === 'inspector')],
    }));
  }

  remove(id: string) {
    this._products.update((l) => l.filter((p) => p.id !== id));
  }

  suspend(id: string, reason: string) {
    this.patch(id, (p) => ({ ...p, status: 'suspended', suspendReason: reason }));
  }
  reactivate(id: string) {
    this.patch(id, (p) => ({ ...p, status: 'active', suspendReason: undefined }));
  }

  /** Sends a rejected or live product back through verification and hides it from customers */
  resubmit(id: string) {
    this.patch(id, (p) => ({
      ...p,
      status: 'pending',
      verifiedAt: null,
      suspendReason: undefined,
      verification: fresh(),
    }));
  }

  // ----- verification workflow -----
  assign(id: string, inspector: { id: string; name: string }, dueDate: string) {
    this.patch(id, (p) => ({
      ...p,
      status: 'pending',
      verification: {
        ...fresh(),
        status: 'assigned',
        inspectorId: inspector.id,
        inspectorName: inspector.name,
        assignedAt: today(),
        dueDate,
      },
    }));
  }
  startCheck(id: string) {
    this.patchV(id, () => ({ status: 'in_review' }));
  }
  toggleCheck(id: string, key: string) {
    this.patchV(id, (v) => ({
      checklist: v.checklist.map((c) => (c.key === key ? { ...c, checked: !c.checked } : c)),
    }));
  }
  addInspectorPhotos(id: string, photos: { url: string; name: string }[]) {
    const imgs: ProductImage[] = photos.map((p) => ({
      id: crypto.randomUUID(),
      url: p.url,
      caption: p.name,
      uploadedBy: 'inspector',
      uploadedAt: today(),
    }));
    this.patch(id, (p) => ({ ...p, images: [...p.images, ...imgs] }));
  }
  removeImage(id: string, imageId: string) {
    this.patch(id, (p) => ({ ...p, images: p.images.filter((i) => i.id !== imageId) }));
  }

  /**
   * Approve: product goes live, stock is capped at what the inspector actually counted,
   * and the grade becomes the one the inspector confirmed.
   */
  decide(
    id: string,
    result: 'approved' | 'rejected',
    d: { notes: string; qty: number; grade: Grade },
  ) {
    this.patch(id, (p) =>
      result === 'approved'
        ? {
            ...p,
            status: 'active',
            verifiedAt: today(),
            stock: Math.min(p.stock, d.qty),
            quality: d.grade,
            verification: {
              ...p.verification,
              status: 'approved',
              notes: d.notes,
              verifiedQty: d.qty,
              decidedAt: today(),
            },
          }
        : {
            ...p,
            status: 'rejected',
            verifiedAt: null,
            verification: {
              ...p.verification,
              status: 'rejected',
              notes: d.notes,
              verifiedQty: d.qty,
              decidedAt: today(),
            },
          },
    );
  }
  reopen(id: string) {
    this.patch(id, (p) => ({
      ...p,
      status: 'pending',
      verifiedAt: null,
      verification: { ...p.verification, status: 'in_review', decidedAt: null },
    }));
  }
}
