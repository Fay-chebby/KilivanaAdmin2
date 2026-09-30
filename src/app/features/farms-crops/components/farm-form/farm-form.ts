import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { KENYA_PHONE } from '../../../../shared/utils/kenya-counties';
import { readImageFiles } from '../../../../shared/utils/image-files';
import { COUNTIES, CROPS, Farm, FarmImage, FarmPayload } from '../../models/farm.model';

const MAX_PHOTOS = 8;

@Component({
  selector: 'app-farm-form',
  imports: [ReactiveFormsModule],
  templateUrl: './farm-form.html',
  styleUrl: './farm-form.scss',
})
export class FarmForm implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly farm = input<Farm | null>(null);
  readonly submitLabel = input('Save farm');
  readonly saved = output<FarmPayload>();
  readonly cancelled = output<void>();

  protected readonly counties = COUNTIES;
  protected readonly cropOptions = CROPS;
  protected readonly maxPhotos = MAX_PHOTOS;

  protected readonly crops = signal<string[]>([]);
  protected readonly images = signal<FarmImage[]>([]);
  protected readonly error = signal('');
  protected readonly dragging = signal(false);
  protected readonly cropError = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    ownerName: ['', [Validators.required, Validators.minLength(3)]],
    ownerPhone: ['', [Validators.required, Validators.pattern(KENYA_PHONE)]],
    county: ['', Validators.required],
    location: ['', [Validators.required, Validators.minLength(3)]],
    sizeHa: [0, [Validators.required, Validators.min(0.1)]],
    status: ['pending' as FarmPayload['status'], Validators.required],
  });

  ngOnInit() {
    const f = this.farm();
    if (!f) return;
    this.form.patchValue(f);
    this.crops.set([...f.crops]);
    this.images.set(f.images.filter((i) => i.uploadedBy === 'farmer'));
  }

  protected bad(c: AbstractControl) {
    return c.invalid && (c.touched || c.dirty);
  }

  protected toggleCrop(c: string) {
    this.crops.update((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));
    this.cropError.set(false);
  }

  protected async add(files: FileList | null) {
    const { items, error } = await readImageFiles(files, MAX_PHOTOS - this.images().length);
    this.error.set(error);
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

  protected removeImage(id: string) {
    this.images.update((l) => l.filter((i) => i.id !== id));
  }

  protected submit() {
    this.cropError.set(this.crops().length === 0);
    if (this.form.invalid || this.crops().length === 0) {
      this.form.markAllAsTouched();
      document
        .querySelector('.err, .crop-err')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    this.saved.emit({
      ...this.form.getRawValue(),
      crops: this.crops(),
      farmerImages: this.images(),
    });
  }
}
