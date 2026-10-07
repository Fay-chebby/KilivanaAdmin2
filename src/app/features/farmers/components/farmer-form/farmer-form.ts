import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FarmerDetail, FarmerFormValue } from '../../models/farmer.model';

type Field =
  | 'name'
  | 'email'
  | 'phone'
  | 'username'
  | 'password'
  | 'region'
  | 'farmName'
  | 'location';

@Component({
  selector: 'app-farmer-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './farmer-form.html',
  styleUrl: './farmer-form.scss',
})
export class FarmerForm {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly farmer = input<FarmerDetail | null>(null);
  readonly mode = input<'create' | 'edit'>('create');
  readonly regions = input<string[]>([]);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly submitLabel = input('Save farmer');

  readonly submitted = output<FarmerFormValue>();
  readonly cancelled = output<void>();

  readonly regionOptions = computed(() => {
    const list = this.regions();
    const current = this.farmer()?.region;

    return current && !list.includes(current) ? [current, ...list] : list;
  });

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],

    email: ['', [Validators.required, Validators.email]],

    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{9,15}$/)]],

    username: ['', [Validators.required, Validators.minLength(3)]],

    password: ['', [Validators.required, Validators.minLength(8)]],

    region: ['', Validators.required],

    farmName: ['', Validators.required],

    location: ['', Validators.required],

    farmDetails: [''],
  });

  /**
   * Files selected from the upload controls.
   */
  readonly farmImages = signal<File[]>([]);
  readonly documents = signal<File[]>([]);

  /**
   * Image preview URLs.
   */
  readonly farmImagePreviews = signal<{ file: File; url: string }[]>([]);

  constructor() {
    // Username/password are only required when creating an account.
    effect(() => {
      const edit = this.mode() === 'edit';

      for (const key of ['username', 'password'] as const) {
        const control = this.form.controls[key];

        if (edit) {
          control.disable({ emitEvent: false });
        } else {
          control.enable({ emitEvent: false });
        }
      }
    });

    // Populate form when editing an existing farmer.
    effect(() => {
      const f = this.farmer();

      if (!f) {
        return;
      }

      this.form.patchValue({
        name: f.name,
        email: f.email,
        phone: f.phone,
        region: f.region,
        farmName: f.profile?.farmName ?? '',
        location: f.profile?.location ?? '',
        farmDetails: f.profile?.farmDetails ?? '',
      });
    });
  }

  invalid(name: Field): boolean {
    const control = this.form.controls[name];

    return control.invalid && (control.dirty || control.touched);
  }

  /**
   * Handle farm image selection.
   */
  onFarmImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const selectedFiles = Array.from(input.files);

    const validImages = selectedFiles.filter((file) => this.isValidImage(file));

    const existing = this.farmImages();

    const merged = [...existing, ...validImages].filter(
      (file, index, array) =>
        array.findIndex(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified,
        ) === index,
    );

    this.farmImages.set(merged);

    this.createImagePreviews(merged);

    // Allow selecting the same file again later.
    input.value = '';
  }

  /**
   * Handle document selection.
   */
  onDocumentsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const selectedFiles = Array.from(input.files);

    const validDocuments = selectedFiles.filter((file) => this.isValidDocument(file));

    const existing = this.documents();

    const merged = [...existing, ...validDocuments].filter(
      (file, index, array) =>
        array.findIndex(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified,
        ) === index,
    );

    this.documents.set(merged);

    // Allow selecting the same file again later.
    input.value = '';
  }

  /**
   * Remove a selected farm image.
   */
  removeFarmImage(index: number): void {
    const files = [...this.farmImages()];

    files.splice(index, 1);

    this.farmImages.set(files);

    this.createImagePreviews(files);
  }

  /**
   * Remove a selected document.
   */
  removeDocument(index: number): void {
    const files = [...this.documents()];

    files.splice(index, 1);

    this.documents.set(files);
  }

  /**
   * Validate images.
   */
  private isValidImage(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    const maxSize = 10 * 1024 * 1024;

    return allowedTypes.includes(file.type) && file.size <= maxSize;
  }

  /**
   * Validate documents.
   */
  private isValidDocument(file: File): boolean {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    const maxSize = 10 * 1024 * 1024;

    return allowedTypes.includes(file.type) && file.size <= maxSize;
  }

  /**
   * Generate previews for farm images.
   */
  private createImagePreviews(files: File[]): void {
    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    this.farmImagePreviews.set(previews);
  }

  /**
   * Format file size.
   */
  fileSize(file: File): string {
    const bytes = file.size;

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Submit farmer.
   */
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.submitted.emit({
      ...value,
      farmImages: this.farmImages(),
      documents: this.documents(),
    });
  }
}
