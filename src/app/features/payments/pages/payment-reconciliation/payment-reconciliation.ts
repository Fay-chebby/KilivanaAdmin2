import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { PayResult, TXN_TYPE_LABEL, kes } from '../../models/payment.model';
import {
  MAX_CSV_BYTES,
  MAX_NOTE,
  MIN_NOTE,
  RECON_FILTERS,
  RECON_KIND_LABEL,
  ReconFilter,
  ReconItem,
  isResolved,
  needsReview,
  signedKes,
} from '../../models/reconciliation.model';
import { ReconciliationService } from '../../services/reconciliation.service';

const PAGE_SIZE = 8;

@Component({
  selector: 'app-payment-reconciliation',
  standalone: true,
  imports: [DatePipe, RouterLink, StatCard],
  templateUrl: './payment-reconciliation.html',
  styleUrl: './payment-reconciliation.scss',
})
export class PaymentReconciliation {
  private service = inject(ReconciliationService);

  readonly filters = RECON_FILTERS;
  readonly kindLabel = RECON_KIND_LABEL;
  readonly typeLabel = TXN_TYPE_LABEL;
  readonly kes = kes;
  readonly signedKes = signedKes;
  readonly maxNote = MAX_NOTE;
  readonly minNote = MIN_NOTE;
  readonly stats = this.service.stats;
  readonly items = this.service.items;

  filter = signal<ReconFilter>('all');
  page = signal(1);
  selectedKey = signal<string | null>(null);
  note = signal('');
  linkTarget = signal('');
  notice = signal<PayResult | null>(null);
  importErrors = signal<string[]>([]);

  readonly counts = computed(() => {
    const l = this.items();
    return {
      all: l.length,
      review: l.filter(needsReview).length,
      matched: l.filter((i) => i.kind === 'matched').length,
      resolved: l.filter(isResolved).length,
    };
  });

  readonly filtered = computed(() => {
    const f = this.filter();
    return this.items().filter((i) =>
      f === 'all'
        ? true
        : f === 'review'
          ? needsReview(i)
          : f === 'matched'
            ? i.kind === 'matched'
            : isResolved(i),
    );
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly pageRows = computed(() => {
    const start = (Math.min(this.page(), this.totalPages()) - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });
  readonly range = computed(() => {
    const total = this.filtered().length;
    if (!total) return '';
    const start = (Math.min(this.page(), this.totalPages()) - 1) * PAGE_SIZE;
    return `Showing ${start + 1}–${start + this.pageRows().length} of ${total}`;
  });

  readonly selected = computed<ReconItem | null>(
    () => this.items().find((i) => i.key === this.selectedKey()) ?? null,
  );

  /** Settled transactions that are not on the statement, offered when linking an unrecognised line. */
  readonly linkOptions = computed(() =>
    this.items().filter((i) => i.kind === 'missing' && !i.resolution && i.txn),
  );

  readonly noteTooShort = computed(() => this.note().trim().length < MIN_NOTE);

  needsReview = needsReview;

  setFilter(f: ReconFilter) {
    this.filter.set(f);
    this.page.set(1);
  }
  prev() {
    this.page.set(Math.max(1, this.page() - 1));
  }
  next() {
    this.page.set(Math.min(this.totalPages(), this.page() + 1));
  }

  select(key: string) {
    this.selectedKey.set(key);
    this.note.set('');
    this.linkTarget.set('');
    this.notice.set(null);
  }

  resolve() {
    const s = this.selected();
    if (!s) return;
    const r = this.service.resolve(s.key, this.note());
    this.notice.set(r);
    if (r.ok) this.note.set('');
  }

  reopen() {
    const s = this.selected();
    if (s) this.notice.set(this.service.reopen(s.key));
  }

  link() {
    const s = this.selected();
    if (!s) return;
    const r = this.service.link(s.key, this.linkTarget());
    this.notice.set(r);
    if (r.ok) this.linkTarget.set('');
  }

  async onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // lets the same file be picked again
    if (!file) return;
    if (file.size > MAX_CSV_BYTES) {
      this.notice.set({
        ok: false,
        message: 'The file is too large. Split it into files under 2 MB.',
      });
      return;
    }
    const r = this.service.importCsv(await file.text());
    this.importErrors.set(
      r.errors.slice(0, 5).concat(r.errors.length > 5 ? [`and ${r.errors.length - 5} more`] : []),
    );
    this.notice.set(r);
    this.page.set(1);
  }

  dismiss() {
    this.notice.set(null);
    this.importErrors.set([]);
  }
}
