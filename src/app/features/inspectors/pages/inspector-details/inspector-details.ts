import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmModal } from '../../components/confirm-modal/confirm-modal';
import { CredentialsModal } from '../../components/credentials-modal/credentials-modal';
import { FarmVerification } from '../../components/farm-verification/farm-verification';
import { ID_TYPES } from '../../models/inspector.model';
import { InspectorService } from '../../services/inspector.service';

@Component({
  selector: 'app-inspector-details',
  imports: [RouterLink, ConfirmModal, CredentialsModal, FarmVerification],
  templateUrl: './inspector-details.html',
  styleUrl: './inspector-details.scss',
})
export class InspectorDetails {
  private readonly service = inject(InspectorService);
  private readonly router = inject(Router);
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly inspector = computed(() => this.service.getById(this.id));
  protected readonly assignments = computed(() => this.service.assignmentsFor(this.id));
  protected readonly selectedId = signal<string | null>(null);
  protected readonly selected = computed(() => {
    const list = this.assignments();
    return list.find((a) => a.id === this.selectedId()) ?? list[0] ?? null;
  });
  protected readonly modal = signal<'suspend' | 'delete' | 'reset' | null>(null);
  protected readonly tempPassword = signal<string | null>(null);
  protected readonly zoom = signal<{ url: string; label: string } | null>(null);

  protected pending() {
    return this.service.pendingFor(this.id);
  }
  protected reactivate() {
    this.service.reactivate(this.id);
  }

  protected idLabel(type: string) {
    return ID_TYPES.find((t) => t.value === type)?.label ?? type;
  }

  protected images() {
    const k = this.inspector()?.kyc;
    if (!k) return [];
    return [
      { label: 'Passport photo', url: k.photoUrl },
      { label: 'ID card, front', url: k.idFrontUrl },
      { label: 'ID card, back', url: k.idBackUrl },
    ];
  }

  protected confirm(reason: string) {
    const m = this.modal();
    if (m === 'delete') {
      this.service.remove(this.id);
      this.router.navigate(['/inspectors']);
    } else if (m === 'suspend') {
      this.service.suspend(this.id, reason);
    } else if (m === 'reset') {
      this.tempPassword.set(this.service.resetPassword(this.id));
    }
    this.modal.set(null);
  }
}
