import { Component, inject, input, signal } from '@angular/core';

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
