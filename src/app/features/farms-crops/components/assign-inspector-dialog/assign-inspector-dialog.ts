import { Component, computed, inject, input, output, signal } from '@angular/core';

import { InspectorService } from '../../../inspectors/services/inspector.service';

export interface Assignment {
  id: string;
  name: string;
  dueDate: string;
}

@Component({
  selector: 'app-assign-inspector-dialog',
  templateUrl: './assign-inspector-dialog.html',
  styleUrl: './assign-inspector-dialog.scss',
})
export class AssignInspectorDialog {
  protected readonly inspectors = inject(InspectorService);

  readonly county = input.required<string>();

  readonly currentId = input<string | null>(null);

  readonly description = input<string | null>(null);

  readonly assigned = output<Assignment>();

  readonly cancelled = output<void>();

  protected readonly selected = signal<string | null>(null);

  protected readonly minDate = new Date().toISOString().slice(0, 10);

  protected readonly due = signal(new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10));

  /**
   * Active inspectors only.
   * Inspectors from the same county come first,
   * followed by inspectors with fewer pending visits.
   */
  protected readonly options = computed(() =>
    this.inspectors
      .inspectors()
      .filter((i) => i.status === 'active' && String(i.id) !== String(this.currentId()))
      .map((i) => ({
        i,

        near: i.region.toLowerCase() === this.county().toLowerCase(),

        pending: this.inspectors.pendingFor(i.id).length,
      }))
      .sort((a, b) => Number(b.near) - Number(a.near) || a.pending - b.pending),
  );

  protected toString(value: number | string): string {
    return String(value);
  }

  protected select(id: number | string): void {
    this.selected.set(String(id));
  }

  protected confirm(): void {
    const selectedId = this.selected();

    if (!selectedId) {
      return;
    }

    const s = this.options().find((o) => String(o.i.id) === selectedId);

    if (!s || !this.due()) {
      return;
    }

    this.assigned.emit({
      id: String(s.i.id),
      name: s.i.name,
      dueDate: this.due(),
    });
  }

  protected cancel(): void {
    this.cancelled.emit();
  }
}
