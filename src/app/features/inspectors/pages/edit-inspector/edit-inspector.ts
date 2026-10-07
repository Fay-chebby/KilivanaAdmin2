import { Component, inject, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { InspectorForm } from '../../components/inspector-form/inspector-form';

import { Inspector, InspectorPayload } from '../../models/inspector.model';

import { InspectorService } from '../../services/inspector.service';

@Component({
  selector: 'app-edit-inspector',

  imports: [InspectorForm, RouterLink],

  templateUrl: './edit-inspector.html',
  styleUrl: './edit-inspector.scss',
})
export class EditInspector {
  private readonly service = inject(InspectorService);

  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);

  protected readonly id = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly inspector = signal<Inspector | null>(null);

  constructor() {
    this.loadInspector();
  }

  private loadInspector(): void {
    if (!Number.isFinite(this.id)) {
      this.router.navigate(['/inspectors']);
      return;
    }

    this.service.getInspector(this.id).subscribe({
      next: (inspector) => {
        this.inspector.set(inspector);
      },

      error: (error) => {
        console.error('Failed to load inspector:', error);

        this.router.navigate(['/inspectors']);
      },
    });
  }

  protected save(payload: InspectorPayload): void {
    this.service.update(this.id, payload).subscribe({
      next: () => {
        this.router.navigate(['/inspectors', this.id]);
      },

      error: (error) => {
        console.error('Failed to update inspector:', error);
      },
    });
  }

  protected cancel(): void {
    this.router.navigate(['/inspectors']);
  }
}
