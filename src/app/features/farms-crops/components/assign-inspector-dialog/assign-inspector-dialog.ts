import { Component, computed, inject, input, output, signal } from '@angular/core';

import { InspectorService } from '../../../inspectors/services/inspector.service';

export interface Assignment {
  id: string;
  name: string;
  dueDate: string;
}

@Component({
  selector: 'app-assign-inspector-dialog',
  standalone: true,
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

  protected readonly minDate = new Date().toLocaleDateString('en-CA');

  protected readonly due = signal(new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10));

  /**
   * Active inspectors are listed first by:
   * 1. Same county
   * 2. Fewest pending visits
   */
  protected readonly options = computed(() => {
    const county = this.county().trim().toLowerCase();
    const currentId = this.currentId();

    return this.inspectors
      .inspectors()
      .filter(
        (inspector) => inspector.status === 'active' && String(inspector.id) !== String(currentId),
      )
      .map((inspector) => ({
        i: inspector,
        near: inspector.region?.trim().toLowerCase() === county,
        pending: this.inspectors.pendingFor(inspector.id).length,
      }))
      .sort((a, b) => Number(b.near) - Number(a.near) || a.pending - b.pending);
  });

  protected toString(value: number | string): string {
    return String(value);
  }

  protected select(id: number | string): void {
    this.selected.set(String(id));
  }

  protected confirm(): void {
    const selectedId = this.selected();
    const dueDate = this.due();

    if (!selectedId || !dueDate || dueDate < this.minDate) {
      return;
    }

    const inspector = this.options().find((option) => String(option.i.id) === selectedId);

    if (!inspector) {
      return;
    }

    this.assigned.emit({
      id: String(inspector.i.id),
      name: inspector.i.name,
      dueDate,
    });
  }

  protected cancel(): void {
    this.cancelled.emit();
  }
}
