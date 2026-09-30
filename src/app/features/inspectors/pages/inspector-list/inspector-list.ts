import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import { Inspector, InspectorStatus } from '../../models/inspector.model';
import { InspectorService } from '../../services/inspector.service';

type Action = { type: 'delete' | 'suspend'; inspector: Inspector };

@Component({
  selector: 'app-inspector-list',
  imports: [RouterLink, StatCard, ConfirmModal],
  templateUrl: './inspector-list.html',
  styleUrl: './inspector-list.scss',
})
export class InspectorList {
  protected readonly service = inject(InspectorService);
  protected readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly statusFilter = signal<'all' | InspectorStatus>('all');
  protected readonly action = signal<Action | null>(null);

  protected readonly stats = this.service.stats;

  protected readonly rows = computed(() => {
    const q = this.search().toLowerCase().trim();
    const s = this.statusFilter();
    return this.service
      .inspectors()
      .filter(
        (i) =>
          (s === 'all' || i.status === s) &&
          (!q ||
            [i.name, i.code, i.region, i.specialization].some((v) => v.toLowerCase().includes(q))),
      );
  });

  protected initials(name: string) {
    return name
      .replace(/^Dr\.?\s+/i, '')
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  protected color(id: string) {
    const palette = ['#e8710a', '#e5195e', '#0a9b3e', '#3b6fe0', '#8a4fd6'];
    return palette[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
  }

  protected statusLabel(s: InspectorStatus) {
    return { active: 'Active', suspended: 'Suspended', on_leave: 'On leave' }[s];
  }

  protected reactivate(i: Inspector) {
    this.service.reactivate(i.id);
  }

  protected confirm(reason: string) {
    const a = this.action();
    if (!a) return;
    if (a.type === 'delete') this.service.remove(a.inspector.id);
    else this.service.suspend(a.inspector.id, reason);
    this.action.set(null);
  }
}
