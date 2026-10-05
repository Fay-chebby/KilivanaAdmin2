import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApprovalActions, ApprovalMode } from '../../components/approval-actions/approval-actions';
import { DocumentViewer } from '../../components/document-viewer/document-viewer';
import { KYC_STATUS_LABEL, KYC_TYPE_LABEL, isOpen, unviewedCount } from '../../models/kyc.model';
import { KycService } from '../../services/kyc.service';

@Component({
  selector: 'app-kyc-review',
  standalone: true,
  imports: [DatePipe, RouterLink, ApprovalActions, DocumentViewer],
  templateUrl: './kyc-review.html',
  styleUrl: './kyc-review.scss',
})
export class KycReview {
  private service = inject(KycService);

  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  readonly typeLabel = KYC_TYPE_LABEL;
  readonly statusLabel = KYC_STATUS_LABEL;
  readonly app = computed(() => this.service.get(this.id));
  readonly open = computed(() => {
    const a = this.app();
    return !!a && isOpen(a);
  });

  activeDocId = signal<string | null>(null);
  mode = signal<ApprovalMode>('idle');
  error = signal('');

  readonly activeDoc = computed(
    () => this.app()?.documents.find((d) => d.id === this.activeDocId()) ?? null,
  );
  readonly blockedReason = computed(() => {
    const a = this.app();
    const n = a ? unviewedCount(a) : 0;
    return n
      ? `Open ${n === 1 ? '1 more document' : `${n} more documents`} to enable approval.`
      : '';
  });

  viewDoc(docId: string) {
    this.service.openDocument(this.id, docId);
    this.activeDocId.set(docId);
  }

  approve() {
    const r = this.service.approve(this.id);
    this.error.set(r.ok ? '' : r.message);
  }

  reject(reason: string) {
    const r = this.service.reject(this.id, reason);
    this.error.set(r.ok ? '' : r.message);
    if (r.ok) this.mode.set('idle');
  }
}
