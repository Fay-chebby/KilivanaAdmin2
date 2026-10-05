import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { ApprovalActions, ApprovalMode } from '../../components/approval-actions/approval-actions';
import { DocumentViewer } from '../../components/document-viewer/document-viewer';
import {
  KYC_FILTERS,
  KYC_STATUS_LABEL,
  KYC_TYPE_LABEL,
  KycApplication,
  KycFilter,
  isOpen,
  unviewedCount,
} from '../../models/kyc.model';
import { KycService } from '../../services/kyc.service';

@Component({
  selector: 'app-kyc-list',
  standalone: true,
  imports: [DatePipe, RouterLink, StatCard, ApprovalActions, DocumentViewer],
  templateUrl: './kyc-list.html',
  styleUrl: './kyc-list.scss',
})
export class KycList {
  private service = inject(KycService);

  readonly filters = KYC_FILTERS;
  readonly typeLabel = KYC_TYPE_LABEL;
  readonly statusLabel = KYC_STATUS_LABEL;
  readonly stats = this.service.stats;

  filter = signal<KycFilter>('all');
  selectedId = signal<string | null>('VQ-001');
  activeDocId = signal<string | null>(null);
  mode = signal<ApprovalMode>('idle');
  error = signal('');
  notice = signal('');

  readonly rows = computed(() =>
    this.service.items().filter((a) => this.filter() === 'all' || a.type === this.filter()),
  );

  readonly selected = computed<KycApplication | null>(
    () => this.service.items().find((a) => a.id === this.selectedId()) ?? null,
  );

  readonly activeDoc = computed(
    () => this.selected()?.documents.find((d) => d.id === this.activeDocId()) ?? null,
  );

  readonly blockedReason = computed(() => {
    const a = this.selected();
    if (!a) return '';
    const n = unviewedCount(a);
    return n
      ? `Open ${n === 1 ? '1 more document' : `${n} more documents`} to enable approval.`
      : '';
  });

  isOpen = isOpen;

  select(id: string, mode: ApprovalMode = 'idle') {
    this.selectedId.set(id);
    this.activeDocId.set(null);
    this.mode.set(mode);
    this.error.set('');
    this.notice.set('');
  }

  viewDoc(docId: string) {
    const a = this.selected();
    if (!a) return;
    this.service.openDocument(a.id, docId);
    this.activeDocId.set(docId);
  }

  /** Table icon: pick the applicant, then approve from the panel once documents are reviewed. */
  quickApprove(a: KycApplication) {
    this.select(a.id);
  }

  approve() {
    const a = this.selected();
    if (!a) return;
    const r = this.service.approve(a.id);
    this.error.set(r.ok ? '' : r.message);
    this.notice.set(r.ok ? r.message : '');
  }

  reject(reason: string) {
    const a = this.selected();
    if (!a) return;
    const r = this.service.reject(a.id, reason);
    this.error.set(r.ok ? '' : r.message);
    this.notice.set(r.ok ? r.message : '');
    if (r.ok) this.mode.set('idle');
  }
}
