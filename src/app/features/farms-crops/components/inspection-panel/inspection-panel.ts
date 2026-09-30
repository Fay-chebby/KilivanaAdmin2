import { Component, computed, inject, input, signal } from '@angular/core';
import { readImageFiles } from '../../../../shared/utils/image-files';
import { Farm, INSPECTION_META } from '../../models/farm.model';
import { FarmService } from '../../services/farm.service';
import {
  AssignInspectorDialog,
  Assignment,
} from '../assign-inspector-dialog/assign-inspector-dialog';

const MAX_INSPECTOR_PHOTOS = 10;

@Component({
  selector: 'app-inspection-panel',
  imports: [AssignInspectorDialog],
  templateUrl: './inspection-panel.html',
  styleUrl: './inspection-panel.scss',
})
export class InspectionPanel {
  private readonly service = inject(FarmService);

  readonly farm = input.required<Farm>();

  protected readonly steps = ['Registered', 'Inspector assigned', 'On-site review', 'Decision'];
  protected readonly showAssign = signal(false);
  protected readonly draft = signal<string | null>(null);
  protected readonly error = signal('');
  protected readonly dragging = signal(false);

  protected readonly insp = computed(() => this.farm().inspection);
  protected readonly meta = computed(() => INSPECTION_META[this.insp().status]);
  protected readonly notes = computed(() => this.draft() ?? this.insp().notes);
  protected readonly photos = computed(() =>
    this.farm().images.filter((i) => i.uploadedBy === 'inspector'),
  );
  protected readonly checked = computed(
    () => this.insp().checklist.filter((c) => c.checked).length,
  );
  protected readonly allChecked = computed(() => this.checked() === this.insp().checklist.length);
  protected readonly overdue = computed(() => {
    const i = this.insp();
    return (
      !!i.dueDate &&
      ['assigned', 'in_review'].includes(i.status) &&
      i.dueDate < new Date().toISOString().slice(0, 10)
    );
  });

  protected assign(a: Assignment) {
    this.service.assign(this.farm().id, { id: a.id, name: a.name }, a.dueDate);
    this.showAssign.set(false);
    this.draft.set(null);
  }

  protected start() {
    this.service.startReview(this.farm().id);
  }
  protected toggle(key: string) {
    this.service.toggleCheck(this.farm().id, key);
  }
  protected removePhoto(id: string) {
    this.service.removeImage(this.farm().id, id);
  }
  protected reopen() {
    this.draft.set(null);
    this.service.reopen(this.farm().id);
  }

  protected async addPhotos(files: FileList | null) {
    const { items, error } = await readImageFiles(
      files,
      MAX_INSPECTOR_PHOTOS - this.photos().length,
    );
    this.error.set(error);
    if (items.length) this.service.addInspectorPhotos(this.farm().id, items);
  }

  protected onPick(e: Event) {
    const el = e.target as HTMLInputElement;
    this.addPhotos(el.files);
    el.value = '';
  }

  protected onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    this.addPhotos(e.dataTransfer?.files ?? null);
  }

  protected onDrag(e: DragEvent, on: boolean) {
    e.preventDefault();
    this.dragging.set(on);
  }

  protected decide(status: 'approved' | 'rejected') {
    const notes = this.notes().trim();
    if (status === 'approved') {
      if (!this.allChecked()) {
        this.error.set('Tick every item on the checklist before approving.');
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
    this.error.set('');
    this.service.decide(this.farm().id, status, notes);
  }
}
