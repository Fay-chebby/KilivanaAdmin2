import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { readImageFiles } from '../../../../shared/utils/image-files';
import {
  GRADES,
  Grade,
  Product,
  ProductImage,
  ProductPayload,
  UNITS,
} from '../../models/product.model';
import { ProductService } from '../../services/product.service';

const MAX_PHOTOS = 6;

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, CurrencyKshPipe],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProductService);

  readonly product = input<Product | null>(null);
  readonly submitLabel = input('Save product');
  readonly saving = input(false);
  readonly saved = output<ProductPayload>();
  readonly cancelled = output<void>();

  protected readonly units = UNITS;
  protected readonly grades = GRADES;
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly maxPhotos = MAX_PHOTOS;
  protected readonly images = signal<ProductImage[]>([]);
  protected readonly imageError = signal('');
  protected readonly dragging = signal(false);
  protected readonly noPhoto = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    sellerId: ['', Validators.required],
    categoryId: this.fb.control<number | null>(null, Validators.required),
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    unit: ['kg', Validators.required],
    priceKes: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    minOrder: [1, [Validators.required, Validators.min(1)]],
    lowStockAt: [10, [Validators.required, Validators.min(0)]],
    grade: ['GRADE_A' as Grade, Validators.required],
    harvestDate: [''],
    farmId: [''],
  });

  private readonly sellerId = toSignal(this.form.controls.sellerId.valueChanges, {
    initialValue: '',
  });
  protected readonly farmers = computed(() =>
    this.service.sellerOptions().filter((s) => s.type === 'farmer'),
  );
  protected readonly suppliers = computed(() =>
    this.service.sellerOptions().filter((s) => s.type === 'supplier'),
  );
  /** Farms of the chosen seller when we can tell, otherwise every farm */
  protected readonly farms = computed(() => {
    const all = this.service.farmOptions();
    const mine = all.filter((f) => f.ownerId && f.ownerId === this.sellerId());
    return mine.length ? mine : all;
  });
  protected readonly seller = computed(() =>
    this.service.sellerOptions().find((s) => s.id === this.sellerId()),
  );
  /** Categories belong to farmers or suppliers, so only the matching ones are offered */
  protected readonly categories = computed(() => {
    const t = this.seller()?.type;
    return this.service.categories().filter((c) => !t || (c.type ?? '').toLowerCase() === t);
  });

  ngOnInit() {
    const p = this.product();
    if (!p) return;
    this.form.patchValue({
      sellerId: p.sellerId,
      categoryId: p.categoryId,
      name: p.name,
      description: p.description,
      unit: p.unit,
      priceKes: p.priceKes,
      stock: p.stock,
      minOrder: p.minOrder,
      lowStockAt: p.lowStockAt,
      grade: p.grade ?? 'GRADE_A',
      harvestDate: p.harvestDate ?? '',
      farmId: p.farmId ?? '',
    });
    this.form.controls.sellerId.disable(); // the owner of a product can't be changed
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
      ...items.map((i) => ({
        id: crypto.randomUUID(),
        url: i.url,
        caption: i.name,
        uploadedBy: 'farmer' as const,
        uploadedAt: now,
        file: i.file,
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
    const imgs = this.images();
    this.saved.emit({
      sellerId: v.sellerId,
      categoryId: v.categoryId,
      name: v.name,
      description: v.description,
      unit: v.unit,
      priceKes: v.priceKes,
      stock: v.stock,
      minOrder: v.minOrder,
      lowStockAt: v.lowStockAt,
      grade: v.grade,
      harvestDate: v.harvestDate,
      farmId: v.farmId || null,
      keptImageIds: imgs.filter((i) => !i.file).map((i) => i.id),
      newFiles: imgs.filter((i) => !!i.file).map((i) => i.file!),
    });
  }
}
