import { Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { InspectorService } from '../../services/inspector.service';

import { FarmAssignment, FarmPhoto } from '../../models/inspector.model';

@Component({
  selector: 'app-farm-verification',
  templateUrl: './farm-verification.html',
  styleUrl: './farm-verification.scss',
})
export class FarmVerification {
  protected readonly service = inject(InspectorService);

  readonly assignment = input.required<FarmAssignment>();

  protected readonly maxPhotos = 6;

  protected readonly uploading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dragging = signal(false);

  protected readonly notes = signal<string>('');

  protected readonly preview = signal<FarmPhoto | null>(null);

  protected readonly error = signal<string | null>(null);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly previewUrls = signal<Record<string, string>>({});

  protected readonly failedPhotos = signal<Record<string, boolean>>({});

  private readonly loadingPhotos = new Set<string>();

  private activePhotoKeys = new Set<string>();

  protected addPhotos(files: FileList | File[]): void {
    const assignment = this.assignment();
    const fileArray = Array.from(files);

    if (!fileArray.length) {
      return;
    }

    const remaining = this.maxPhotos - assignment.photos.length;

    if (remaining <= 0) {
      this.error.set(`Maximum of ${this.maxPhotos} photos allowed.`);
      return;
    }

    const filesToUpload = fileArray.slice(0, remaining);

    this.uploading.set(true);
    this.error.set(null);

    let completed = 0;
    let failed = 0;

    filesToUpload.forEach((file) => {
      this.service.uploadEvidenceImage(assignment.inspectionId, file).subscribe({
        next: (image) => {
          const photo: FarmPhoto = {
            id: String(image.id),
            url: image.url,
            caption: '',
            takenAt: image.createdAt,
          };

          this.service.addPhotos(assignment.id, [photo]);
        },

        error: (error) => {
          failed++;
          completed++;

          console.error('Failed to upload evidence:', error);

          if (completed === filesToUpload.length) {
            this.uploading.set(false);
          }

          this.error.set('Failed to upload one or more images.');
        },

        complete: () => {
          completed++;

          if (completed === filesToUpload.length) {
            this.uploading.set(false);

            if (failed > 0) {
              this.error.set('Some images could not be uploaded.');
            }
          }
        },
      });
    });
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.dragging.set(false);

    const files = event.dataTransfer?.files;

    if (!files?.length) {
      return;
    }

    this.addPhotos(files);
  }

  protected onPick(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    this.addPhotos(input.files);

    input.value = '';
  }

  protected remove(photo: FarmPhoto): void {
    this.removePhoto(photo);
  }

  protected removePhoto(photo: FarmPhoto): void {
    const assignment = this.assignment();

    const imageId = Number(photo.id);

    if (!Number.isFinite(imageId)) {
      this.error.set('Invalid image ID.');
      return;
    }

    this.error.set(null);

    this.service.deleteEvidenceImage(assignment.inspectionId, imageId).subscribe({
      next: () => {
        this.service.removePhoto(assignment.id, photo.id);
      },

      error: (error) => {
        console.error('Failed to delete evidence:', error);

        this.error.set('Failed to remove image.');
      },
    });
  }

  constructor() {
    effect(() => {
      const assignment = this.assignment();

      // Do not make the effect depend on changes to previewUrls.
      untracked(() => {
        this.loadPhotoPreviews(assignment);
      });
    });

    // Release temporary browser image URLs when the component is destroyed.
    this.destroyRef.onDestroy(() => {
      for (const url of Object.values(this.previewUrls())) {
        URL.revokeObjectURL(url);
      }
    });
  }

  private photoKey(photo: FarmPhoto): string {
    return `${this.assignment().inspectionId}-${photo.id}`;
  }

  protected displayUrl(photo: FarmPhoto): string | null {
    const key = this.photoKey(photo);

    return this.previewUrls()[key] ?? null;
  }

  protected photoFailed(photo: FarmPhoto): boolean {
    return this.failedPhotos()[this.photoKey(photo)] ?? false;
  }

  private loadPhotoPreviews(assignment: FarmAssignment): void {
    const photos = assignment.photos ?? [];

    const activeKeys = new Set(photos.map((photo) => `${assignment.inspectionId}-${photo.id}`));

    this.activePhotoKeys = activeKeys;

    // Remove image URLs belonging to photos no longer displayed.
    for (const [key, url] of Object.entries(this.previewUrls())) {
      if (!activeKeys.has(key)) {
        URL.revokeObjectURL(url);

        this.previewUrls.update((current) => {
          const updated = { ...current };
          delete updated[key];
          return updated;
        });
      }
    }

    for (const photo of photos) {
      const key = `${assignment.inspectionId}-${photo.id}`;

      if (this.previewUrls()[key] || this.loadingPhotos.has(key) || this.failedPhotos()[key]) {
        continue;
      }

      this.loadingPhotos.add(key);

      this.service
        .getEvidenceImageBlob(photo.url)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (blob) => {
            this.loadingPhotos.delete(key);

            const objectUrl = URL.createObjectURL(blob);

            // Ignore responses for an assignment that is no longer displayed.
            if (!this.activePhotoKeys.has(key)) {
              URL.revokeObjectURL(objectUrl);
              return;
            }

            this.previewUrls.update((current) => ({
              ...current,
              [key]: objectUrl,
            }));
          },

          error: (error) => {
            this.loadingPhotos.delete(key);

            console.error('Failed to load inspection image:', photo.url, error);

            if (this.activePhotoKeys.has(key)) {
              this.failedPhotos.update((current) => ({
                ...current,
                [key]: true,
              }));
            }
          },
        });
    }
  }

  protected decide(status: 'verified' | 'rejected'): void {
    this.submitVerification(status, this.notes() ?? '');
  }

  protected reopen(): void {
    this.submitVerification('pending', this.notes() ?? '');
  }

  protected submitVerification(status: 'pending' | 'verified' | 'rejected', notes: string): void {
    const assignment = this.assignment();

    let result = 'CHANGES_REQUIRED';

    if (status === 'verified') {
      result = 'APPROVED';
    } else if (status === 'rejected') {
      result = 'REJECTED';
    }

    this.saving.set(true);
    this.error.set(null);

    this.service.submitVerification(assignment, result, notes).subscribe({
      next: () => {
        this.saving.set(false);
      },

      error: (error) => {
        this.saving.set(false);

        console.error('Failed to submit verification:', error);

        this.error.set('Failed to submit verification.');
      },
    });
  }
}
