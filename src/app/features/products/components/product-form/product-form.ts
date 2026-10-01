import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { KENYA_COUNTIES, KENYA_PHONE } from '../../../../shared/utils/kenya-counties';
import { readImageFiles } from '../../../../shared/utils/image-files';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { FarmService } from '../../../farms-crops/services/farm.service';
import {
  CATEGORIES,
  GRADES,
  Grade,
  Product,
  ProductImage,
  ProductPayload,
  SellerType,
  UNITS,
  Unit,
} from '../../models/product.model';

const MAX_PHOTOS = 6;

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, CurrencyKshPipe],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly farms = inject(FarmService);

  readonly product = input<Product | null>(null);
  readonly submitLabel = input('Save product');
  readonly saved = output<ProductPayload>();
  readonly cancelled = output<void>();

  protected readonly counties = KENYA_COUNTIES;
  protected readonly categories = CATEGORIES;
  protected readonly grades = GRADES;
  protected readonly units = UNITS;
  protected readonly farmOptions = this.farms.farms;
  protected readonly maxPhotos = MAX_PHOTOS;
  protected readonly today = new Date().toISOString().slice(0, 10);

  protected readonly images = signal<ProductImage[]>([]);
  protected readonly imageError = signal('');
  protected readonly dragging = signal(false);
  protected readonly noPhoto = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    sellerName: ['', [Validators.required, Validators.minLength(3)]],
    sellerType: ['farmer' as SellerType, Validators.required],
    sellerPhone: ['', [Validators.required, Validators.pattern(KENYA_PHONE)]],
    county: ['', Validators.required],
    farmId: [''],
    priceKes: [0, [Validators.required, Validators.min(1)]],
    unit: ['kg' as Unit, Validators.required],
    stock: [0, [Validators.required, Validators.min(0)]],
    minOrder: [1, [Validators.required, Validators.min(1)]],
    lowStockAt: [100, [Validators.required, Validators.min(0)]],
    quality: ['Grade A' as Grade, Validators.required],
    harvestDate: ['', Validators.required],
  });

  protected farmNote() {
    const f = this.farms.getById(this.form.controls.farmId.value);
    if (!f) return '';
    return f.certified
      ? `Certified farm in ${f.county}.`
      : 'This farm is not certified yet. Verification will check the product on site anyway.';
  }

  ngOnInit() {
    const p = this.product();
    if (!p) return;
    this.form.patchValue({ ...p, farmId: p.farmId ?? '' });
    this.images.set(p.images.filter((i) => i.uploadedBy === 'farmer'));
  }

  protected bad(c: AbstractControl) {
    return c.invalid && (c.touched || c.dirty);
  }

  protected async add(files: FileList | null) {
    const { items, error } = await readImageFiles(files, MAX_PHOTOS - this.images().length);
    this.imageError.set(error);
    const now = new Date().toISOString().slice(0, 10);
    this.images.update((l) => [
      ...l,
      ...items.map((p) => ({
        id: crypto.randomUUID(),
        url: p.url,
        caption: p.name,
        uploadedBy: 'farmer' as const,
        uploadedAt: now,
      })),
    ]);
    if (items.length) this.noPhoto.set(false);
  }
  protected onPick(e: Event) {
    const el = e.target as HTMLInputElement;
    this.add(el.files);
    el.value = '';
  }
  protected onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    this.add(e.dataTransfer?.files ?? null);
  }
  protected onDrag(e: DragEvent, on: boolean) {
    e.preventDefault();
    this.dragging.set(on);
  }
  protected remove(id: string) {
    this.images.update((l) => l.filter((i) => i.id !== id));
  }

  protected submit() {
    this.noPhoto.set(this.images().length === 0);
    if (this.form.invalid || this.images().length === 0) {
      this.form.markAllAsTouched();
      document
        .querySelector('.err, .photo-err')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    const v = this.form.getRawValue();
    this.saved.emit({ ...v, farmId: v.farmId || null, sellerImages: this.images() });
  }
}
