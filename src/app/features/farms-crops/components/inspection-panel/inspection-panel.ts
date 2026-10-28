import { Component, computed, effect, inject, input, signal, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Farm, INSPECTION_META } from '../../models/farm.model';
import {
  InspectionEvidenceImage,
  InspectionRequest,
  InspectionResponse,
} from '../../models/inspection.model';
import { FarmService, apiError } from '../../services/farm.service';
import {
  AssignInspectorDialog,
  Assignment,
} from '../assign-inspector-dialog/assign-inspector-dialog';

interface InspectionPhoto {
  id: number;
  url: string;
  name?: string;
}

type PanelStatus = 'unassigned' | 'assigned' | 'in_review' | 'approved' | 'rejected' | 'cancelled';

@Component({
  selector: 'app-inspection-panel',
  standalone: true,
  imports: [AssignInspectorDialog],
  templateUrl: './inspection-panel.html',
  styleUrl: './inspection-panel.scss',
})
export class InspectionPanel implements OnDestroy {
  private readonly service = inject(FarmService);

  readonly farm = input.required<Farm>();

  protected readonly steps = ['Registered', 'Inspector assigned', 'On-site review', 'Decision'];

  protected readonly inspection = signal<InspectionResponse | null>(null);
  protected readonly evidence = signal<InspectionPhoto[]>([]);
  protected readonly loading = signal(false);
  protected readonly evidenceLoading = signal(false);
  protected readonly saving = signal(false);

  protected readonly showAssign = signal(false);
  protected readonly draft = signal<string | null>(null);
  protected readonly error = signal('');
  protected readonly dragging = signal(false);

  /**
   * Browser-created URLs for downloaded image blobs.
   * These must be revoked when replaced or when the component is destroyed.
   */
  private readonly imageObjectUrls = new Set<string>();

  protected readonly checklist = signal<{ key: string; label: string; checked: boolean }[]>([
    {
      key: 'ownership',
      label: 'Farm ownership verified',
      checked: false,
    },
    {
      key: 'land',
      label: 'Farm land and location verified',
      checked: false,
    },
    {
      key: 'production',
      label: 'Production facilities inspected',
      checked: false,
    },
    {
      key: 'compliance',
      label: 'Farm requirements met',
      checked: false,
    },
  ]);

  protected readonly insp = computed(() => {
    const current = this.inspection();

    return {
      status: this.normaliseStatus(current),
      notes: current?.notes ?? '',
      dueDate: null as string | null,
    };
  });

  protected readonly meta = computed(() => {
    const status = this.insp().status;

    if (status in INSPECTION_META) {
      return INSPECTION_META[status as keyof typeof INSPECTION_META];
    }

    return INSPECTION_META['unassigned'];
  });

  protected readonly notes = computed(() => this.draft() ?? this.insp().notes);

  protected readonly photos = computed(() => this.evidence());

  protected readonly checked = computed(
    () => this.checklist().filter((item) => item.checked).length,
  );

  protected readonly allChecked = computed(
    () => this.checklist().length > 0 && this.checked() === this.checklist().length,
  );

  protected readonly overdue = computed(() => false);

  constructor() {
    effect(() => {
      const farmId = this.farm().id;
      this.loadInspection(farmId);
    });
  }

  ngOnDestroy(): void {
    this.releaseImageObjectUrls();
  }

  /** Revoke all browser-created image URLs. */
  private releaseImageObjectUrls(): void {
    for (const url of this.imageObjectUrls) {
      URL.revokeObjectURL(url);
    }

    this.imageObjectUrls.clear();
  }

  /** Handle a failed image display in the template. */
  protected onImageError(photo: InspectionPhoto): void {
    console.error(`Failed to display inspection image ${photo.id}:`, photo.url);
  }

  /**
   * Map backend inspection statuses and results into the values
   * expected by inspection-panel.html.
   */

  private normaliseStatus(current: InspectionResponse | null): PanelStatus {
    if (!current) {
      return 'unassigned';
    }

    const status = String(current.status ?? '').toUpperCase();
    const result = String(current.result ?? '').toUpperCase();

    if (status === 'CANCELLED') {
      return 'cancelled';
    }

    if (result === 'APPROVED') {
      return 'approved';
    }

    if (result === 'REJECTED') {
      return 'rejected';
    }

    if (status === 'IN_PROGRESS') {
      return 'in_review';
    }

    if (status === 'ASSIGNED' || status === 'PENDING') {
      return current.inspectorId ? 'assigned' : 'unassigned';
    }

    if (status === 'COMPLETED') {
      return 'in_review';
    }

    return 'unassigned';
  }

  /**
   * Load inspections for the farm and select the most recently updated one.
   */
  protected loadInspection(farmId: number): void {
    this.loading.set(true);
    this.error.set('');

    this.service.getFarmInspection(farmId).subscribe({
      next: (inspections) => {
        const latest =
          [...inspections].sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();

            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();

            return dateB - dateA;
          })[0] ?? null;

        this.inspection.set(latest);
        this.draft.set(null);
        this.loading.set(false);

        if (latest) {
          void this.loadEvidence(latest.id);
        } else {
          this.evidence.set([]);
          this.releaseImageObjectUrls();
        }
      },
      error: (err) => {
        this.inspection.set(null);
        this.evidence.set([]);
        this.releaseImageObjectUrls();
        this.loading.set(false);

        this.error.set(
          err?.status === 404 ? 'No inspection has been created for this farm yet.' : apiError(err),
        );
      },
    });
  }

  /**
   * Fetch the evidence records saved by the backend, download their images,
   * and convert the image blobs into browser URLs for the template.
   *
   * This method is also used after uploading photos, so both initial
   * loading and refreshing follow the same image-loading process.
   */

  private async loadEvidence(inspectionId: number): Promise<void> {
    this.evidenceLoading.set(true);
    this.error.set('');

    try {
      const images: InspectionEvidenceImage[] = await firstValueFrom(
        this.service.getInspectionEvidence(inspectionId),
      );

      console.log('Inspection ID:', inspectionId);
      console.log('Evidence records returned by backend:', images);

      for (const image of images ?? []) {
        console.log('Inspection image details:', {
          id: image.id,
          url: image.url,
          sortOrder: image.sortOrder,
        });
      }

      // Release old browser-created image URLs.
      this.releaseImageObjectUrls();

      const validImages = (images ?? []).filter((image) => !!image.url);

      // Show the loading indicator while images are downloaded.
      const loadedPhotos = await Promise.all(
        validImages.map(async (image, index): Promise<InspectionPhoto> => {
          const photo: InspectionPhoto = {
            id: image.id,
            url: image.url,
            name: `Inspection photo ${image.sortOrder + 1 || index + 1}`,
          };

          try {
            const blob = await firstValueFrom(this.service.getInspectionImageBlob(image.url));

            if (!blob.type.startsWith('image/')) {
              console.error(`The response for inspection photo ${image.id} is not an image.`, {
                url: image.url,
                contentType: blob.type,
              });

              return photo;
            }

            const objectUrl = URL.createObjectURL(blob);
            this.imageObjectUrls.add(objectUrl);

            return {
              ...photo,
              url: objectUrl,
            };
          } catch (err) {
            console.error(`Could not download inspection image ${image.id}:`, err);

            // Keep the original URL as a fallback.
            return photo;
          }
        }),
      );

      this.evidence.set(loadedPhotos);
    } catch (err) {
      console.error('Could not load inspection evidence:', err);
      this.evidence.set([]);
      this.error.set(apiError(err));
    } finally {
      // Always stop loading, whether the request succeeds or fails.
      this.evidenceLoading.set(false);
    }
  }

  protected assign(assignment: Assignment): void {
    this.error.set('');

    const farmId = Number(this.farm().id);
    const inspectorId = Number(assignment.id);

    if (
      !Number.isSafeInteger(farmId) ||
      farmId <= 0 ||
      !Number.isSafeInteger(inspectorId) ||
      inspectorId <= 0
    ) {
      this.error.set('Invalid farm or inspector ID.');
      return;
    }

    if (this.inspection()) {
      this.error.set(
        'An inspection already exists. Reassignment requires a backend endpoint that updates the inspector.',
      );
      return;
    }

    this.saving.set(true);

    const request: InspectionRequest = {
      inspectorId,
      targetType: 'FARM',
      targetId: farmId,
      status: 'ASSIGNED',
      notes: assignment.dueDate ? `Inspection due date: ${assignment.dueDate}` : null,
    };

    this.service.assignInspector(request).subscribe({
      next: (created) => {
        this.inspection.set(created);
        this.showAssign.set(false);
        this.draft.set(null);
        this.saving.set(false);
        this.error.set('');

        void this.loadEvidence(created.id);
      },
      error: (err: unknown) => {
        this.error.set(apiError(err));
        this.saving.set(false);
      },
    });
  }

  protected start(): void {
    const current = this.inspection();

    if (!current) {
      this.error.set('Assign an inspector first.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    this.service.updateInspectionStatus(current.id, 'IN_PROGRESS').subscribe({
      next: (updated) => {
        this.inspection.set(updated);
        this.saving.set(false);
        this.error.set('');
      },
      error: (err) => {
        this.error.set(apiError(err));
        this.saving.set(false);
      },
    });
  }

  protected toggle(key: string): void {
    this.checklist.update((items) =>
      items.map((item) => (item.key === key ? { ...item, checked: !item.checked } : item)),
    );
  }

  protected removePhoto(id: number): void {
    const current = this.inspection();

    if (!current) {
      return;
    }

    this.service.deleteInspectionEvidence(current.id, id).subscribe({
      next: () => {
        const photo = this.evidence().find((item) => item.id === id);

        if (photo && this.imageObjectUrls.has(photo.url)) {
          URL.revokeObjectURL(photo.url);
          this.imageObjectUrls.delete(photo.url);
        }

        this.evidence.update((photos) => photos.filter((photo) => photo.id !== id));

        this.error.set('');
      },
      error: (err) => {
        this.error.set(apiError(err));
      },
    });
  }

  protected reopen(): void {
    const current = this.inspection();

    if (!current) {
      return;
    }

    this.saving.set(true);
    this.draft.set(null);
    this.error.set('');

    this.service.updateInspectionStatus(current.id, 'IN_PROGRESS').subscribe({
      next: (updated) => {
        this.inspection.set(updated);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err));
        this.saving.set(false);
      },
    });
  }

  protected updateNotes(value: string): void {
    this.draft.set(value);
    this.error.set('');
  }

  protected async addPhotos(files: FileList | null): Promise<void> {
    const current = this.inspection();

    if (!current) {
      this.error.set('Assign an inspector before uploading evidence.');
      return;
    }

    if (!files?.length) {
      return;
    }

    const remaining = 10 - this.photos().length;

    if (remaining <= 0) {
      this.error.set('You can upload a maximum of 10 inspection photos.');
      return;
    }

    const selected = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, remaining);

    if (!selected.length) {
      this.error.set('Please select valid image files.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    try {
      // Upload each selected image to the backend.
      for (const file of selected) {
        await firstValueFrom(this.service.uploadInspectionEvidence(current.id, file));
      }

      // Reload the authoritative evidence list and download the images.
      await this.loadEvidence(current.id);
    } catch (err) {
      this.error.set(apiError(err));
    } finally {
      this.saving.set(false);
    }
  }

  protected onPick(event: Event): void {
    const element = event.target as HTMLInputElement;

    void this.addPhotos(element.files);

    // Allow selecting the same file again if necessary.
    element.value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);

    void this.addPhotos(event.dataTransfer?.files ?? null);
  }

  protected onDrag(event: DragEvent, active: boolean): void {
    event.preventDefault();
    this.dragging.set(active);
  }

  protected decide(status: 'approved' | 'rejected'): void {
    const current = this.inspection();

    if (!current) {
      this.error.set('No inspection is loaded.');
      return;
    }

    if (this.saving()) {
      return;
    }

    const notes = this.notes().trim();

    // Approval requires every checklist item to be checked.
    if (status === 'approved') {
      if (!this.allChecked()) {
        this.error.set('Tick every checklist item before approving.');
        return;
      }

      // Approval also requires at least one evidence photo.
      if (this.photos().length === 0) {
        this.error.set('Add at least one on-site photo before approving.');
        return;
      }
    }

    // Rejection requires an explanation.
    if (status === 'rejected' && !notes) {
      this.error.set('Add a note explaining why the farm was rejected.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    // These values must match the backend InspectionResult enum.
    const result = status === 'approved' ? 'APPROVED' : 'REJECTED';

    this.service.submitInspectionResult(current.id, result, notes).subscribe({
      next: (updated) => {
        this.inspection.set(updated);
        this.draft.set(null);
        this.saving.set(false);
        this.error.set('');
      },
      error: (err) => {
        this.error.set(apiError(err));
        this.saving.set(false);
      },
    });
  }
}
