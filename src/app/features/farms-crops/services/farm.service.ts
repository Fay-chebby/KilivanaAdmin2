import { Injectable, computed, signal } from '@angular/core';
import {
  DEFAULT_CHECKLIST,
  Farm,
  FarmImage,
  FarmInspection,
  FarmPayload,
  InspectionStatus,
} from '../models/farm.model';

const today = () => new Date().toISOString().slice(0, 10);

/** Generates a soft farm-scene picture so demo farms have photos */
function scene(i: number): string {
  const sky = [
    ['#bfe3f5', '#eaf6e4'],
    ['#f9d9b0', '#fdf1d8'],
    ['#c9e4de', '#eef7ea'],
    ['#d6d9f2', '#f1f0fa'],
  ][i % 4];
  const g = ['#2f8f4e', '#3ea35d', '#1f7a44', '#5aaf6a'][i % 4];
  let rows = '';
  for (let r = 0; r < 7; r++) {
    const y = 195 + r * 15;
    rows += `<path d='M0 ${y} Q200 ${y - 16 - r * 2} 400 ${y}' stroke='#1b5e35' stroke-opacity='.35' stroke-width='3' fill='none'/>`;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${sky[0]}'/><stop offset='1' stop-color='${sky[1]}'/></linearGradient></defs><rect width='400' height='300' fill='url(#s)'/><circle cx='320' cy='70' r='28' fill='#fff7c2'/><path d='M0 170 Q100 120 200 165 T400 150 V300 H0Z' fill='${g}'/>${rows}</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const img = (i: number, caption: string, by: 'farmer' | 'inspector' = 'farmer'): FarmImage => ({
  id: crypto.randomUUID(),
  url: scene(i),
  caption,
  uploadedBy: by,
  uploadedAt: '2026-09-12',
});

const fresh = (): FarmInspection => ({
  status: 'unassigned',
  inspectorId: null,
  inspectorName: null,
  assignedAt: null,
  dueDate: null,
  notes: '',
  checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c })),
  decidedAt: null,
});

const done = (c: boolean) => DEFAULT_CHECKLIST.map((x) => ({ ...x, checked: c }));

@Injectable({ providedIn: 'root' })
export class FarmService {
  private readonly _farms = signal<Farm[]>([
    {
      id: 'f1',
      code: 'FM-001',
      name: 'Kamau Tea Estate',
      ownerName: 'Wanjiru Kamau',
      ownerPhone: '0712345001',
      county: 'Kiambu',
      location: 'Limuru',
      sizeHa: 12,
      crops: ['Tea', 'Avocado'],
      certified: true,
      status: 'active',
      registeredAt: '2026-06-02',
      images: [
        img(0, 'Tea rows, north slope'),
        img(1, 'Farm entrance'),
        img(2, 'Avocado block'),
        img(3, 'Drying shed'),
        img(0, 'Inspector: boundary check', 'inspector'),
      ],
      inspection: {
        status: 'approved',
        inspectorId: '1',
        inspectorName: 'Dr. Wambui Njoroge',
        assignedAt: '2026-06-05',
        dueDate: '2026-06-12',
        notes: 'Boundaries and crops match the registration.',
        checklist: done(true),
        decidedAt: '2026-06-11',
      },
    },
    {
      id: 'f2',
      code: 'FM-002',
      name: 'Rift Valley Wheat Fields',
      ownerName: 'Kiprono Cheruiyot',
      ownerPhone: '0722345002',
      county: 'Uasin Gishu',
      location: 'Moiben',
      sizeHa: 48,
      crops: ['Wheat', 'Maize'],
      certified: true,
      status: 'active',
      registeredAt: '2026-06-10',
      images: [img(1, 'Wheat before harvest'), img(2, 'Storage silo')],
      inspection: {
        status: 'approved',
        inspectorId: '2',
        inspectorName: 'Brian Kiprop',
        assignedAt: '2026-06-12',
        dueDate: '2026-06-19',
        notes: 'Verified on site.',
        checklist: done(true),
        decidedAt: '2026-06-18',
      },
    },
    {
      id: 'f3',
      code: 'FM-003',
      name: 'Otieno Lakeside Farm',
      ownerName: 'Achieng Otieno',
      ownerPhone: '0733345003',
      county: 'Kisumu',
      location: 'Nyando',
      sizeHa: 22,
      crops: ['Sugarcane', 'Sweet Potato'],
      certified: false,
      status: 'active',
      registeredAt: '2026-08-20',
      images: [img(2, 'Sugarcane plot'), img(3, 'Sweet potato beds'), img(1, 'Irrigation channel')],
      inspection: {
        ...fresh(),
        status: 'assigned',
        inspectorId: '3',
        inspectorName: 'Faith Achieng',
        assignedAt: '2026-09-24',
        dueDate: '2026-10-05',
      },
    },
    {
      id: 'f4',
      code: 'FM-004',
      name: 'Mt. Kenya Coffee Cooperative',
      ownerName: 'Mwangi Gathogo',
      ownerPhone: '0700345004',
      county: 'Nyeri',
      location: 'Mathira',
      sizeHa: 15,
      crops: ['Coffee', 'Macadamia'],
      certified: false,
      status: 'pending',
      registeredAt: '2026-09-26',
      images: [img(3, 'Coffee cherries ripening'), img(0, 'Pulping station')],
      inspection: fresh(),
    },
    {
      id: 'f5',
      code: 'FM-005',
      name: 'Naivasha Blooms',
      ownerName: 'Naomi Wekesa',
      ownerPhone: '0711345005',
      county: 'Nakuru',
      location: 'Naivasha',
      sizeHa: 8,
      crops: ['Cut Flowers', 'Kale'],
      certified: false,
      status: 'pending',
      registeredAt: '2026-09-15',
      images: [img(1, 'Greenhouse row 1'), img(2, 'Greenhouse row 2')],
      inspection: {
        ...fresh(),
        status: 'in_review',
        inspectorId: '1',
        inspectorName: 'Dr. Wambui Njoroge',
        assignedAt: '2026-09-20',
        dueDate: '2026-09-30',
        checklist: DEFAULT_CHECKLIST.map((c, i) => ({ ...c, checked: i < 2 })),
      },
    },
    {
      id: 'f6',
      code: 'FM-006',
      name: 'Kitui Dryland Farm',
      ownerName: 'Mutua Musyoka',
      ownerPhone: '0720345006',
      county: 'Kitui',
      location: 'Mwingi',
      sizeHa: 30,
      crops: ['Millet', 'Sorghum', 'Cowpeas'],
      certified: false,
      status: 'pending',
      registeredAt: '2026-08-02',
      images: [img(0, 'Millet field'), img(3, 'Farm gate')],
      inspection: {
        ...fresh(),
        status: 'rejected',
        inspectorId: '2',
        inspectorName: 'Brian Kiprop',
        assignedAt: '2026-08-05',
        dueDate: '2026-08-12',
        notes: 'Only about 10 ha are cultivated. Farmer should resubmit with the correct size.',
        checklist: DEFAULT_CHECKLIST.map((c, i) => ({ ...c, checked: i !== 1 })),
        decidedAt: '2026-08-11',
      },
    },
  ]);

  readonly farms = this._farms.asReadonly();

  readonly stats = computed(() => {
    const l = this._farms();
    return {
      total: l.length,
      hectares: l.reduce((a, f) => a + f.sizeHa, 0),
      certified: l.filter((f) => f.certified).length,
      awaiting: l.filter((f) =>
        ['unassigned', 'assigned', 'in_review'].includes(f.inspection.status),
      ).length,
    };
  });

  /** Hectares are shared equally between a farm's crops */
  readonly crops = computed(() => {
    const map = new Map<
      string,
      { name: string; farms: number; hectares: number; counties: Set<string> }
    >();
    for (const f of this._farms()) {
      for (const c of f.crops) {
        const e = map.get(c) ?? { name: c, farms: 0, hectares: 0, counties: new Set<string>() };
        e.farms++;
        e.hectares += f.sizeHa / f.crops.length;
        e.counties.add(f.county);
        map.set(c, e);
      }
    }
    return [...map.values()].sort((a, b) => b.hectares - a.hectares);
  });

  getById(id: string) {
    return this._farms().find((f) => f.id === id);
  }

  private patch(id: string, fn: (f: Farm) => Farm) {
    this._farms.update((l) => l.map((f) => (f.id === id ? fn(f) : f)));
  }
  private patchInspection(
    id: string,
    fn: (i: FarmInspection, f: Farm) => Partial<Farm> & { inspection?: FarmInspection },
  ) {
    this.patch(id, (f) => ({ ...f, ...fn(f.inspection, f) }));
  }

  create(p: FarmPayload): Farm {
    const { farmerImages, ...rest } = p;
    const farm: Farm = {
      ...rest,
      id: crypto.randomUUID(),
      code: `FM-${String(this._farms().length + 1).padStart(3, '0')}`,
      certified: false,
      images: farmerImages,
      registeredAt: today(),
      inspection: fresh(),
    };
    this._farms.update((l) => [...l, farm]);
    return farm;
  }

  update(id: string, p: FarmPayload) {
    const { farmerImages, ...rest } = p;
    this.patch(id, (f) => ({
      ...f,
      ...rest,
      images: [...farmerImages, ...f.images.filter((i) => i.uploadedBy === 'inspector')],
    }));
  }

  remove(id: string) {
    this._farms.update((l) => l.filter((f) => f.id !== id));
  }

  // ----- inspection workflow -----
  assign(id: string, inspector: { id: string; name: string }, dueDate: string) {
    this.patchInspection(id, () => ({
      inspection: {
        ...fresh(),
        status: 'assigned',
        inspectorId: inspector.id,
        inspectorName: inspector.name,
        assignedAt: today(),
        dueDate,
      },
    }));
  }
  startReview(id: string) {
    this.setStatus(id, 'in_review');
  }
  reopen(id: string) {
    this.patchInspection(id, (i) => ({
      certified: false,
      inspection: { ...i, status: 'in_review', decidedAt: null },
    }));
  }
  private setStatus(id: string, status: InspectionStatus) {
    this.patchInspection(id, (i) => ({ inspection: { ...i, status } }));
  }
  toggleCheck(id: string, key: string) {
    this.patchInspection(id, (i) => ({
      inspection: {
        ...i,
        checklist: i.checklist.map((c) => (c.key === key ? { ...c, checked: !c.checked } : c)),
      },
    }));
  }
  addInspectorPhotos(id: string, photos: { url: string; name: string }[]) {
    const imgs: FarmImage[] = photos.map((p) => ({
      id: crypto.randomUUID(),
      url: p.url,
      caption: p.name,
      uploadedBy: 'inspector',
      uploadedAt: today(),
    }));
    this.patch(id, (f) => ({ ...f, images: [...f.images, ...imgs] }));
  }
  removeImage(id: string, imageId: string) {
    this.patch(id, (f) => ({ ...f, images: f.images.filter((i) => i.id !== imageId) }));
  }
  decide(id: string, status: 'approved' | 'rejected', notes: string) {
    this.patchInspection(
      id,
      (i) =>
        ({
          certified: status === 'approved',
          status: status === 'approved' ? 'active' : 'pending',
          inspection: { ...i, status, notes, decidedAt: today() },
        }) as Partial<Farm> & { inspection: FarmInspection },
    );
  }
}
