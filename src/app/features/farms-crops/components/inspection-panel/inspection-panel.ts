
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import { Farm, INSPECTION_META } from '../../models/farm.model';
import { InspectionResponse } from '../../models/inspection.model';
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

@Component({
  selector: 'app-inspection-panel',
  standalone: true,
  imports: [AssignInspectorDialog],
  templateUrl: './inspection-panel.html',
  styleUrl: './inspection-panel.scss',
})
export class InspectionPanel {
  private readonly service = inject(FarmService);

  readonly farm = input.required<Farm>();

  protected readonly steps = [
    'Registered',
    'Inspector assigned',
    'On-site review',
    'Decision',
  ];

  protected readonly inspection = signal<InspectionResponse | null>(null);
  protected readonly evidence = signal<InspectionPhoto[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  protected readonly showAssign = signal(false);
  protected readonly draft = signal<string | null>(null);
  protected readonly error = signal('');
  protected readonly dragging = signal(false);

  // The backend inspection response does not include checklist items.
  // Keep this local until a checklist API is available.
  protected readonly checklist = signal<
    { key: string; label: string; checked: boolean }[]
  >([
    { key: 'ownership', label: 'Farm ownership verified', checked: false },
    { key: 'land', label: 'Farm land and location verified', checked: false },
    { key: 'production', label: 'Production facilities inspected', checked: false },
    { key: 'compliance', label: 'Farm requirements met', checked: false },
  ]);

  protected readonly insp = computed(() => {
    const current = this.inspection();

    return {
      status: this.normaliseStatus(current?.status),
      notes: current?.notes ?? '',
      dueDate: null as string | null,
    };
  });

protected readonly meta = computed(() => {
  const status = this.insp().status;

  if (status in INSPECTION_META) {
    return INSPECTION_META[
      status as keyof typeof INSPECTION_META
    ];
  }

  return INSPECTION_META['unassigned'];
});

  protected readonly notes = computed(
    () => this.draft() ?? this.insp().notes,
  );

  protected readonly photos = computed(() => this.evidence());

  protected readonly checked = computed(
    () => this.checklist().filter((item) => item.checked).length,
  );

  protected readonly allChecked = computed(
    () =>
      this.checklist().length > 0 &&
      this.checked() === this.checklist().length,
  );

  protected readonly overdue = computed(() => false);

  constructor() {
    effect(() => {
      const farmId = this.farm().id;
      this.loadInspection(farmId);
    });
  }

  private normaliseStatus(
    status: string | null | undefined,
  ): string {
    const value = (status ?? 'unassigned').toLowerCase();

    if (value === 'in review' || value === 'in-review') {
      return 'in_review';
    }

    return value;
  }

  protected loadInspection(farmId: number): void {
    this.loading.set(true);
    this.error.set('');

    this.service.getFarmInspection(farmId).subscribe({
      next: (inspection) => {
        this.inspection.set(inspection);
        this.draft.set(null);
        this.loading.set(false);

        this.loadEvidence(inspection.id);
      },
      error: (err) => {
        this.inspection.set(null);
        this.evidence.set([]);
        this.loading.set(false);

        this.error.set(
          err?.status === 404
            ? 'No inspection has been created for this farm yet.'
            : apiError(err),
        );
      },
    });
  }

  private loadEvidence(inspectionId: number): void {
    this.service.getInspectionEvidence(inspectionId).subscribe({
      next: (response: any) => {
        const raw = Array.isArray(response)
          ? response
          : response?.data ?? [];

        this.evidence.set(
          raw
            .map((item: any) => ({
              id: Number(item.id ?? item.imageId),
              url: item.url ?? item.imageUrl ?? item.evidenceUrl,
              name: item.name ?? item.fileName,
            }))
            .filter(
              (item: InspectionPhoto) =>
                Number.isFinite(item.id) && !!item.url,
            ),
        );
      },
      error: () => this.evidence.set([]),
    });
  }

  protected assign(assignment: Assignment): void {
    this.error.set('');

    const current = this.inspection();

    // Reassignment requires a supported backend update endpoint.
    if (current) {
      this.error.set(
        'An inspection already exists. Reassignment requires a backend update endpoint.',
      );
      return;
    }

    this.saving.set(true);

    this.service.assignInspector({
      id: assignment.id,
      targetType: 'FARM',
      targetId: this.farm().id,
      status: 'ASSIGNED',
      notes: `Inspection due date: ${assignment.dueDate}`,
      evidenceUrls: [],
    } as any).subscribe({
      next: (inspection) => {
        this.inspection.set(inspection);
        this.showAssign.set(false);
        this.draft.set(null);
        this.saving.set(false);
        this.loadEvidence(inspection.id);
      },
      error: (err) => {
        this.error.set(apiError(err));
        this.saving.set(false);
      },
    });
  }

  protected start(): void {
    const inspection = this.inspection();

    if (!inspection) {
      this.error.set('Assign an inspector first.');
      return;
    }

    this.saving.set(true);

    this.service
      .updateInspectionStatus(inspection.id, 'IN_REVIEW')
      .subscribe({
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
      items.map((item) =>
        item.key === key ? { ...item, checked: !item.checked } : item,
      ),
    );
  }

  protected removePhoto(id: number): void {
    const inspection = this.inspection();

    if (!inspection) return;

    this.service
      .deleteInspectionEvidence(inspection.id, id)
      .subscribe({
        next: () => {
          this.evidence.update((photos) =>
            photos.filter((photo) => photo.id !== id),
          );
          this.error.set('');
        },
        error: (err) => this.error.set(apiError(err)),
      });
  }

  protected reopen(): void {
    const inspection = this.inspection();

    if (!inspection) return;

    this.draft.set(null);
    this.error.set('');

    this.service
      .updateInspectionStatus(inspection.id, 'IN_REVIEW')
      .subscribe({
        next: (updated) => this.inspection.set(updated),
        error: (err) => this.error.set(apiError(err)),
      });
  }

  protected updateNotes(value: string): void {
    this.draft.set(value);
    this.error.set('');
  }

  protected async addPhotos(files: FileList | null): Promise<void> {
    const inspection = this.inspection();

    if (!inspection) {
      this.error.set('Assign an inspector before uploading evidence.');
      return;
    }

    if (!files?.length) return;

    const remaining = 10 - this.photos().length;

    if (remaining <= 0) {
      this.error.set('You can upload a maximum of 10 inspection photos.');
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    this.saving.set(true);
    this.error.set('');

    // Upload the actual File objects, not data URL previews.
    for (const file of selected) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.service
            .uploadInspectionEvidence(inspection.id, file)
            .subscribe({
              next: () => resolve(),
              error: (err) => reject(err),
            });
        });
      } catch (err) {
        this.error.set(apiError(err));
        this.saving.set(false);
        return;
      }
    }

    this.loadEvidence(inspection.id);
    this.saving.set(false);
  }

  protected onPick(event: Event): void {
    const element = event.target as HTMLInputElement;
    void this.addPhotos(element.files);
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
    const inspection = this.inspection();
    const notes = this.notes().trim();

    if (!inspection) {
      this.error.set('No inspection is loaded.');
      return;
    }

    if (status === 'approved') {
      if (!this.allChecked()) {
        this.error.set('Tick every checklist item before approving.');
        return;
      }

      if (this.photos().length === 0) {
        this.error.set('Add at least one on-site photo before approving.');
        return;
      }
    } else if (!notes) {
      this.error.set('Add a note explaining why the farm was rejected.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    this.service
      .submitInspectionResult(
        inspection.id,
        status.toUpperCase(),
        notes,
      )
      .subscribe({
        next: (updated) => {
          this.inspection.set(updated);
          this.draft.set(null);
          this.saving.set(false);
        },
        error: (err) => {
          this.error.set(apiError(err));
          this.saving.set(false);
        },
      });
  }
}
