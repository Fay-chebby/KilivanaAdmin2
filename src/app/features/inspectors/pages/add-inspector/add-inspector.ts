import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { CredentialsModal } from '../../components/credentials-modal/credentials-modal';
import { InspectorForm } from '../../components/inspector-form/inspector-form';

import { InspectorCreatePayload, InspectorPayload } from '../../models/inspector.model';
import { InspectorService } from '../../services/inspector.service';

@Component({
  selector: 'app-add-inspector',
  imports: [InspectorForm, CredentialsModal, RouterLink],
  templateUrl: './add-inspector.html',
  styleUrl: './add-inspector.scss',
})
export class AddInspector {
  private readonly service = inject(InspectorService);
  private readonly router = inject(Router);

  protected readonly created = signal<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  protected save(payload: InspectorCreatePayload | InspectorPayload): void {
    if (!('temporaryPassword' in payload)) {
      return;
    }

    this.service.create(payload).subscribe({
      next: (inspector) => {
        this.created.set({
          name: inspector.name,
          email: inspector.email,
          password: payload.temporaryPassword,
        });
      },
      error: (error) => {
        console.error('Failed to create inspector:', error);
      },
    });
  }

  protected finish(): void {
    this.created.set(null);
    this.router.navigate(['/inspectors']);
  }

  protected cancel(): void {
    this.router.navigate(['/inspectors']);
  }
}
