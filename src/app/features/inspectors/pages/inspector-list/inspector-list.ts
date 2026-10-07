import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';

import { Inspector, InspectorStatus } from '../../models/inspector.model';

import { InspectorService } from '../../services/inspector.service';

type Action = {
  type: 'delete' | 'suspend';
  inspector: Inspector;
};

@Component({
  selector: 'app-inspector-list',

  imports: [RouterLink, StatCard, ConfirmModal],

  templateUrl: './inspector-list.html',
  styleUrl: './inspector-list.scss',
})
export class InspectorList implements OnInit {
  protected readonly service = inject(InspectorService);

  protected readonly router = inject(Router);

  protected readonly search = signal('');

  protected readonly statusFilter = signal<'all' | InspectorStatus>('all');

  protected readonly action = signal<Action | null>(null);

  protected readonly stats = this.service.stats;

  protected readonly rows = computed(() => {
    const q = this.search().toLowerCase().trim();

    const status = this.statusFilter();

    return this.service.inspectors().filter((inspector) => {
      const matchesStatus = status === 'all' || inspector.status === status;

      const matchesSearch =
        !q ||
        [
          inspector.name,
          inspector.code,
          inspector.region,
          inspector.specialization,
          inspector.email,
        ].some((value) => value.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.service.loadInspectors().subscribe({
      error: (error) => {
        console.error('Failed to load inspectors', error);
      },
    });
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected color(id: number): string {
    const colors = ['green', 'blue', 'purple', 'orange', 'teal'];

    return colors[id % colors.length];
  }

  protected statusLabel(status: InspectorStatus): string {
    return {
      active: 'Active',
      suspended: 'Suspended',
      on_leave: 'On leave',
    }[status];
  }

  protected reactivate(inspector: Inspector): void {
    this.service.reactivate(inspector.id).subscribe({
      error: (error) => console.error('Failed to reactivate inspector', error),
    });
  }

  protected confirm(reason: string): void {
    const action = this.action();

    if (!action) {
      return;
    }

    if (action.type === 'delete') {
      this.service.remove(action.inspector.id).subscribe({
        error: (error) => console.error('Failed to delete inspector', error),
      });
    } else {
      this.service.suspend(action.inspector.id, reason).subscribe({
        error: (error) => console.error('Failed to suspend inspector', error),
      });
    }

    this.action.set(null);
  }
}
