import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CredentialsModal } from '../../components/credentials-modal/credentials-modal';
import { InspectorForm } from '../../components/inspector-form/inspector-form';
import { InspectorCreatePayload } from '../../models/inspector.model';
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

  protected readonly created = signal<{ name: string; email: string; password: string } | null>(
    null,
  );

  protected save(payload: InspectorCreatePayload) {
    const i = this.service.create(payload);
    // Show the login details once so the admin can hand them over at the office
    this.created.set({ name: i.name, email: i.email, password: payload.temporaryPassword });
  }

  protected finish() {
    this.created.set(null);
    this.router.navigate(['/inspectors']);
  }

  protected cancel() {
    this.router.navigate(['/inspectors']);
  }
}
