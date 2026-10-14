import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { KENYA_PHONE } from '../../../../shared/utils/kenya-counties';
import { readImageFiles } from '../../../../shared/utils/image-files';
import { COUNTIES, CROPS, Farm, FarmImage, FarmPayload } from '../../models/farm.model';

const MAX_PHOTOS = 8;

@Component({
  selector: 'app-farm-form',
  standalone: true,
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

  ngOnInit(): void {
    const f = this.farm();

    if (!f) return;

    this.form.patchValue({
      name: f.name,
      ownerName: f.farmerName ?? '',
      ownerPhone: '',
      county: f.county ?? '',
      location: f.address ?? '',
      sizeHa: f.sizeAcres ?? 0,
      status: f.status as FarmPayload['status'],
    });

    this.crops.set([...f.cropNames]);

    this.images.set(f.images.filter((image) => image.uploadedBy === 'farmer'));
  }

  protected bad(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected toggleCrop(crop: string): void {
    this.crops.update((list) =>
      list.includes(crop) ? list.filter((item) => item !== crop) : [...list, crop],
    );

    this.cropError.set(false);
  }

  protected async add(files: FileList | null): Promise<void> {
    const remaining = MAX_PHOTOS - this.images().length;

    if (!files?.length || remaining <= 0) {
      if (remaining <= 0) {
        this.error.set(`You can upload a maximum of ${MAX_PHOTOS} photos.`);
      }
      return;
    }

    const { items, error } = await readImageFiles(files, remaining);

    this.error.set(error);

    const now = new Date().toISOString();

    const newImages: FarmImage[] = items.map((item) => ({
      id: -Date.now() - Math.floor(Math.random() * 1_000_000),
      url: item.url,
      isPrimary: false,
      caption: item.name,
      uploadedBy: 'farmer',
      uploadedAt: now,
    }));

    this.images.update((list) => [...list, ...newImages]);
  }

  protected onPick(event: Event): void {
    const element = event.target as HTMLInputElement;

    void this.add(element.files);
    element.value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    void this.add(event.dataTransfer?.files ?? null);
  }

  protected onDrag(event: DragEvent, active: boolean): void {
    event.preventDefault();
    this.dragging.set(active);
  }

  protected removeImage(id: number): void {
    this.images.update((list) => list.filter((image) => image.id !== id));
  }

  protected submit(): void {
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
