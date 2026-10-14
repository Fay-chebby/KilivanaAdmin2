export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

export const FARM_STATUSES = ['ACTIVE', 'FALLOW', 'INACTIVE'];
export const CROP_STATUSES = ['PLANNED', 'GROWING', 'HARVESTED', 'FAILED'];
export const OWNERSHIP_TYPES = ['OWNED', 'LEASED', 'COMMUNAL'];

/* ---------- API shapes (from the OpenAPI document) ---------- */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error?: { code: string; details: string } | null;
}

export interface ApiCrop {
  id: number;
  farmId?: number | null;
  farmName?: string | null;
  farmerId?: number | null;
  farmerName?: string | null;
  cropType?: { id: number; name: string; category: string } | null;
  variety?: string | null;
  areaAcres?: number | null;
  status?: string | null;
  plantingDate?: string | null;
  expectedHarvestDate?: string | null;
  expectedYieldKg?: number | null;
  createdAt?: string | null;
}

export interface ApiFarm {
  id: number;
  farmerId?: number | null;
  farmerName?: string | null; // not in the OpenAPI yet; shown if the backend adds it
  name: string;
  county?: string | null;
  subCounty?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sizeAcres?: number | null;
  ownershipType?: string | null;
  status?: string | null;
  description?: string | null;
  images?: { id: number; url: string; isPrimary: boolean }[] | null;
  crops?: ApiCrop[] | null;
  createdAt?: string | null;
}

export interface ApiCropType {
  id: number;
  name: string;
  category: string;
  active?: boolean;
}
export interface ApiCropSummary {
  cropTypeId: number;
  name: string;
  farmCount: number;
  totalAreaAcres: number;
  expectedYieldKg: number;
}

/* ---------- UI models ---------- */
export interface Crop {
  id: number;
  farmId: number | null;
  farmName: string | null;
  farmerId: number | null;
  farmerName: string | null;
  typeId: number | null;
  name: string | null;
  category: string | null;
  variety: string | null;
  areaAcres: number | null;
  status: string;
  plantingDate: string | null;
  expectedHarvestDate: string | null;
  expectedYieldKg: number | null;
}

export interface FarmImage {
  id: number;
  url: string;
  isPrimary: boolean;
}

export interface Farm {
  id: number;
  farmerId: number | null;
  farmerName: string | null;
  name: string;
  county: string | null;
  subCounty: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  sizeAcres: number | null;
  ownershipType: string | null;
  status: string;
  description: string | null;
  images: FarmImage[];
  crops: Crop[];
  cropNames: string[];
  createdAt: string | null;
}

export interface FarmEditValue {
  name: string;
  county: string;
  subCounty: string;
  address: string;
  sizeAcres: number | null;
  ownershipType: string;
  description: string;
}

/* ---------- mapping ---------- */
export const toCrop = (c: ApiCrop): Crop => ({
  id: c.id,
  farmId: c.farmId ?? null,
  farmName: c.farmName ?? null,
  farmerId: c.farmerId ?? null,
  farmerName: c.farmerName ?? null,
  typeId: c.cropType?.id ?? null,
  name: c.cropType?.name ?? null,
  category: c.cropType?.category ?? null,
  variety: c.variety ?? null,
  areaAcres: c.areaAcres ?? null,
  status: (c.status ?? '').toUpperCase(),
  plantingDate: c.plantingDate ?? null,
  expectedHarvestDate: c.expectedHarvestDate ?? null,
  expectedYieldKg: c.expectedYieldKg ?? null,
});

export const toFarm = (f: ApiFarm): Farm => {
  const crops = (f.crops ?? []).map(toCrop).map((c) => ({
    ...c,
    farmId: c.farmId ?? f.id,
    farmName: c.farmName ?? f.name,
    farmerId: c.farmerId ?? f.farmerId ?? null,
    farmerName: c.farmerName ?? f.farmerName ?? null,
  }));
  return {
    id: f.id,
    farmerId: f.farmerId ?? null,
    farmerName: f.farmerName ?? null,
    name: f.name,
    county: f.county ?? null,
    subCounty: f.subCounty ?? null,
    address: f.address ?? null,
    latitude: f.latitude ?? null,
    longitude: f.longitude ?? null,
    sizeAcres: f.sizeAcres ?? null,
    ownershipType: f.ownershipType ?? null,
    status: (f.status ?? '').toUpperCase(),
    description: f.description ?? null,
    images: f.images ?? [],
    crops,
    cropNames: [...new Set(crops.map((c) => c.name ?? '').filter(Boolean))],
    createdAt: f.createdAt ?? null,
  };
};

/* ---------- display helpers ---------- */
export const dash = (v: unknown): string =>
  v === null || v === undefined || v === '' ? '—' : String(v);
export const titleCase = (s: string | null | undefined) =>
  s
    ? s
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())
    : '—';

export const farmTone = (s: string): Tone =>
  s === 'ACTIVE' ? 'green' : s === 'FALLOW' ? 'amber' : 'gray';
export const cropTone = (s: string): Tone =>
  s === 'GROWING' ? 'green' : s === 'HARVESTED' ? 'blue' : s === 'FAILED' ? 'red' : 'gray';

export const initials = (name: string) =>
  (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

/** The 47 counties of Kenya. Used when GET /regions fails or returns nothing. */
export const KENYA_COUNTIES: string[] = [
  'Baringo',
  'Bomet',
  'Bungoma',
  'Busia',
  'Elgeyo-Marakwet',
  'Embu',
  'Garissa',
  'Homa Bay',
  'Isiolo',
  'Kajiado',
  'Kakamega',
  'Kericho',
  'Kiambu',
  'Kilifi',
  'Kirinyaga',
  'Kisii',
  'Kisumu',
  'Kitui',
  'Kwale',
  'Laikipia',
  'Lamu',
  'Machakos',
  'Makueni',
  'Mandera',
  'Marsabit',
  'Meru',
  'Migori',
  'Mombasa',
  "Murang'a",
  'Nairobi',
  'Nakuru',
  'Nandi',
  'Narok',
  'Nyamira',
  'Nyandarua',
  'Nyeri',
  'Samburu',
  'Siaya',
  'Taita-Taveta',
  'Tana River',
  'Tharaka-Nithi',
  'Trans-Nzoia',
  'Turkana',
  'Uasin Gishu',
  'Vihiga',
  'Wajir',
  'West Pokot',
];
