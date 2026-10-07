import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import { CredentialsModal } from '../../components/credentials-modal/credentials-modal';
import { FarmVerification } from '../../components/farm-verification/farm-verification';

import { InspectorService } from '../../services/inspector.service';

@Component({
  selector: 'app-inspector-details',

  imports: [DatePipe, RouterLink, ConfirmModal, CredentialsModal, FarmVerification],

  templateUrl: './inspector-details.html',
  styleUrl: './inspector-details.scss',
})
export class InspectorDetails implements OnInit {
  private readonly service = inject(InspectorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly id = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly inspector = computed(() => this.service.getById(this.id));

  protected readonly assignments = computed(() => this.service.assignmentsFor(this.id));

  protected readonly selectedId = signal<string | null>(null);

  protected readonly selected = computed(() => {
    const list = this.assignments();

    return list.find((assignment) => assignment.id === this.selectedId()) ?? list[0] ?? null;
  });

  protected readonly modal = signal<'suspend' | 'delete' | 'reset' | null>(null);

  protected readonly tempPassword = signal<string | null>(null);

  protected readonly zoom = signal<{
    url: string;
    label: string;
  } | null>(null);

  ngOnInit(): void {
    if (!Number.isFinite(this.id) || this.id <= 0) {
      this.router.navigate(['/inspectors']);
      return;
    }

    this.service.getInspector(this.id).subscribe({
      error: (error) => {
        console.error('Failed to load inspector:', error);
      },
    });

    this.service.loadAssignments(this.id).subscribe({
      error: (error) => {
        console.error('Failed to load inspector inspections:', error);
      },
    });
  }

  protected pending(): number {
    return this.service.pendingFor(this.id).length;
  }

  protected reactivate(): void {
    this.service.reactivate(this.id).subscribe({
      error: (error) => {
        console.error('Failed to reactivate inspector:', error);
      },
    });
  }

  protected images() {
    return this.inspector()?.images ?? [];
  }

  protected confirm(reason: string): void {
    const modal = this.modal();

    if (modal === 'delete') {
      this.service.remove(this.id).subscribe({
        next: () => {
          this.router.navigate(['/inspectors']);
        },

        error: (error) => {
          console.error('Failed to delete inspector:', error);
        },
      });

      this.modal.set(null);
      return;
    }

    if (modal === 'suspend') {
      this.service.suspend(this.id, reason).subscribe({
        error: (error) => {
          console.error('Failed to suspend inspector:', error);
        },
      });

      this.modal.set(null);
      return;
    }

    if (modal === 'reset') {
      console.warn('Inspector password reset endpoint is not available in the current API.');

      this.modal.set(null);
      return;
    }

    this.modal.set(null);
  }
}
