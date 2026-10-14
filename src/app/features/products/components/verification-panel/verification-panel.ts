import { Component, computed, inject, input, signal } from '@angular/core';
import { readImageFiles } from '../../../../shared/utils/image-files';
import {
  AssignInspectorDialog,
  Assignment,
} from '../../../farms-crops/components/assign-inspector-dialog/assign-inspector-dialog';
import { GRADES, Grade, Product, VERIFY_META, PickedImage } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

const MAX_PHOTOS = 10;

@Component({
  selector: 'app-verification-panel',
  imports: [AssignInspectorDialog],
  templateUrl: './verification-panel.html',
  styleUrl: './verification-panel.scss',
})
export class VerificationPanel {
  protected readonly service = inject(ProductService);

  readonly product = input.required<Product>();

  protected readonly steps = ['Submitted', 'Verifier assigned', 'On-site check', 'Decision'];
  protected readonly grades = GRADES;
  protected readonly draftGrade = signal<Grade | null>(null);
  protected readonly showAssign = signal(false);
  protected readonly draftNotes = signal<string | null>(null);
  protected readonly draftQty = signal<number | null>(null);
  protected readonly error = signal('');
  protected readonly dragging = signal(false);

  protected readonly v = computed(() => this.product().verification);
  protected readonly meta = computed(() => VERIFY_META[this.v().status]);
  protected readonly notes = computed(() => this.draftNotes() ?? this.v().notes);
  protected readonly qty = computed(
    () => this.draftQty() ?? this.v().verifiedQty ?? this.product().stock,
  );
  protected readonly grade = computed<Grade>(
    () => this.draftGrade() ?? this.product().grade ?? 'GRADE_A',
  );
  protected readonly photos = computed(() =>
    this.product().images.filter((i) => i.uploadedBy === 'inspector'),
  );
  protected readonly checked = computed(() => this.v().checklist.filter((c) => c.checked).length);
  protected readonly allChecked = computed(
    () => this.v().checklist.length > 0 && this.checked() === this.v().checklist.length,
  );

  protected async assign(a: Assignment) {
    if (await this.service.assign(this.product().id, a.id)) {
      this.showAssign.set(false);
      this.draftNotes.set(null);
      this.draftQty.set(null);
      this.draftGrade.set(null);
    }
  }
  protected start() {
    return this.service.startCheck(this.product().id);
  }
  protected toggle(key: string) {
    this.service.toggleCheck(this.product().id, key);
  }
  protected removePhoto(id: string) {
    return this.service.removeImage(this.product().id, id);
  }
  protected reopen() {
    this.draftNotes.set(null);
    return this.service.reopen(this.product().id);
  }

  protected async addPhotos(files: FileList | null) {
    const { items, error } = await readImageFiles(files, MAX_PHOTOS - this.photos().length);
    this.error.set(error);
    if (items.length)
      await this.service.addInspectorPhotos(
        this.product().id,
        items.map((i) => i.file),
      );
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

  protected async decide(result: 'approved' | 'rejected') {
    const notes = this.notes().trim();
    if (result === 'approved') {
      if (!this.allChecked()) {
        this.error.set('Tick every item on the checklist before approving.');
        return;
      }
      if (this.photos().length === 0) {
        this.error.set('Add at least one on-site photo before approving.');
        return;
      }
      if (!(this.qty() > 0)) {
        this.error.set('Enter the quantity you counted. It must be above 0.');
        return;
      }
    } else if (!notes) {
      this.error.set('Add a note explaining why this product failed verification.');
      return;
    }
    this.error.set('');
    await this.service.decide(this.product().id, result, {
      notes,
      qty: Math.max(0, this.qty()),
      grade: this.grade(),
    });
  }
}
