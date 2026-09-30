import { Component, inject, input, signal } from '@angular/core';
import { FarmPhoto } from '../../models/inspector.model';
import { FarmAssignment } from '../../models/inspector.model';
import { InspectorService } from '../../services/inspector.service';

const MAX_PHOTOS = 8;
const MAX_MB = 5;

/**
 * Shows the farm an inspector was sent to check, lets photo evidence be added
 * (drag & drop, file picker or phone camera), and records the verdict.
 */
@Component({
  selector: 'app-farm-verification',
  templateUrl: './farm-verification.html',
  styleUrl: './farm-verification.scss',
})
export class FarmVerification {
  private readonly service = inject(InspectorService);

  readonly assignment = input.required<FarmAssignment>();

  protected readonly dragging = signal(false);
  protected readonly error = signal('');
  protected readonly preview = signal<FarmPhoto | null>(null);
  protected readonly notes = signal('');
  protected readonly maxPhotos = MAX_PHOTOS;

  protected onPick(event: Event) {
    const el = event.target as HTMLInputElement;
    this.handleFiles(el.files);
    el.value = '';
  }

  protected onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
    this.handleFiles(event.dataTransfer?.files ?? null);
  }

  protected onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(true);
  }

  private async handleFiles(files: FileList | null) {
    if (!files?.length) return;
    this.error.set('');
    const a = this.assignment();
    const room = MAX_PHOTOS - a.photos.length;
    const accepted: File[] = [];

    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) {
        this.error.set(`${f.name} is not an image.`);
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        this.error.set(`${f.name} is larger than ${MAX_MB} MB.`);
        continue;
      }
      accepted.push(f);
    }
    if (accepted.length > room)
      this.error.set(`Only ${MAX_PHOTOS} photos per farm. Extra files were skipped.`);

    const photos = await Promise.all(accepted.slice(0, room).map((f) => this.toPhoto(f)));
    if (photos.length) this.service.addPhotos(a.id, photos);
    // Real API: send `accepted` as multipart FormData to /assignments/:id/photos
  }

  private toPhoto(file: File): Promise<FarmPhoto> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          id: crypto.randomUUID(),
          url: reader.result as string,
          caption: file.name,
          takenAt: new Date().toISOString(),
        });
      reader.readAsDataURL(file);
    });
  }

  protected remove(photo: FarmPhoto) {
    this.service.removePhoto(this.assignment().id, photo.id);
  }

  protected decide(status: 'verified' | 'rejected') {
    const a = this.assignment();
    const notes = this.notes().trim() || a.notes;
    if (status === 'rejected' && !notes) {
      this.error.set('Add a note explaining why the farm was rejected.');
      return;
    }
    if (status === 'verified' && a.photos.length === 0) {
      this.error.set('Add at least one photo before verifying the farm.');
      return;
    }
    this.error.set('');
    this.service.submitVerification(a.id, status, notes);
  }

  protected reopen() {
    this.service.submitVerification(this.assignment().id, 'pending', this.assignment().notes);
  }
}
