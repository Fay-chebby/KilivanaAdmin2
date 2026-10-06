import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { PaymentActionDialog } from '../../components/payment-action-dialog/payment-action-dialog';
import { ChartPoint, RevenueChart } from '../../components/revenue-chart/revenue-chart';
import {
  PAYMENT_TABS,
  PLATFORM_FEE_RATE,
  PayResult,
  PaymentTab,
  TXN_STATUS_LABEL,
  TXN_TYPE_LABEL,
  Transaction,
  canSettle,
  compactKes,
  kes,
} from '../../models/payment.model';
import { PaymentService } from '../../services/payment.service';

const PAGE_SIZE = 5;

type DialogState = { kind: 'batch' } | { kind: 'settle'; id: string };

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [DatePipe, RouterLink, StatCard, RevenueChart, PaymentActionDialog],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss',
})
export class PaymentList {
  private service = inject(PaymentService);
  private destroyRef = inject(DestroyRef);
  private noticeTimer?: ReturnType<typeof setTimeout>;

  readonly tabs = PAYMENT_TABS;
  readonly typeLabel = TXN_TYPE_LABEL;
  readonly statusLabel = TXN_STATUS_LABEL;
  readonly kes = kes;
  readonly compactKes = compactKes;
  readonly canSettle = canSettle;
  readonly stats = this.service.stats;
  readonly feePct = Math.round(PLATFORM_FEE_RATE * 1000) / 10;

  tab = signal<PaymentTab>('all');
  page = signal(1);
  dialog = signal<DialogState | null>(null);
  notice = signal<PayResult | null>(null);

  readonly chartPoints = computed<ChartPoint[]>(() =>
    this.service.monthly.map((m) => ({
      label: m.label,
      value: m.revenue,
      display: kes(m.revenue),
    })),
  );

  readonly counts = computed(() => {
    const all = this.service.transactions();
    return {
      all: all.length,
      payout: all.filter((t) => t.type === 'payout').length,
      refund: all.filter((t) => t.type === 'refund').length,
    };
  });

  readonly filtered = computed(() =>
    this.service.transactions().filter((t) => this.tab() === 'all' || t.type === this.tab()),
  );

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly pageRows = computed(() => {
    const start = (Math.min(this.page(), this.totalPages()) - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });
  readonly range = computed(() => {
    const total = this.filtered().length;
    if (!total) return '';
    const start = (Math.min(this.page(), this.totalPages()) - 1) * PAGE_SIZE;
    return `Showing ${start + 1}–${start + this.pageRows().length} of ${total} ${this.tabNoun()}`;
  });
  private tabNoun = computed(
    () => ({ all: 'transactions', payout: 'payouts', refund: 'refunds' })[this.tab()],
  );

  /** What the confirmation dialog shows, or null when it is closed. */
  readonly dialogView = computed(() => {
    const d = this.dialog();
    if (!d) return null;
    if (d.kind === 'batch') {
      const pending = this.service
        .transactions()
        .filter((t) => t.type === 'payout' && t.status === 'pending');
      const lines = pending.slice(0, 6).map((t) => `${t.party}: ${kes(t.amount)}`);
      if (pending.length > 6) lines.push(`and ${pending.length - 6} more`);
      return {
        title: 'Run payout batch',
        message: `Pay ${pending.length} farmer${pending.length === 1 ? '' : 's'} now? This sends ${kes(pending.reduce((s, t) => s + t.amount, 0))} by M-Pesa.`,
        lines,
        confirmLabel: 'Run batch',
        tone: 'green' as const,
      };
    }
    const t = this.service.get(d.id);
    if (!t) return null;
    const refund = t.type === 'refund';
    return {
      title: refund ? 'Process refund' : 'Pay farmer now',
      message: refund
        ? `Refund ${kes(t.amount)} to ${t.party} for order ${t.reference}?`
        : `Pay ${kes(t.amount)} to ${t.party} for order ${t.reference}?`,
      lines: [] as string[],
      confirmLabel: refund ? 'Process refund' : 'Pay now',
      tone: refund ? ('red' as const) : ('green' as const),
    };
  });

  setTab(t: PaymentTab) {
    this.tab.set(t);
    this.page.set(1);
  }

  /** Arrow keys move between tabs. */
  onTabKey(e: KeyboardEvent) {
    const i = this.tabs.findIndex((t) => t.key === this.tab());
    const next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const target = this.tabs[(next + this.tabs.length) % this.tabs.length];
    this.setTab(target.key);
    queueMicrotask(() =>
      (document.getElementById('tab-' + target.key) as HTMLElement | null)?.focus(),
    );
  }

  prev() {
    this.page.set(Math.max(1, this.page() - 1));
  }
  next() {
    this.page.set(Math.min(this.totalPages(), this.page() + 1));
  }

  openBatch() {
    if (this.stats().pendingPayoutCount) this.dialog.set({ kind: 'batch' });
  }
  openSettle(t: Transaction) {
    this.dialog.set({ kind: 'settle', id: t.id });
  }

  confirm() {
    const d = this.dialog();
    if (!d) return;
    this.dialog.set(null);
    this.showNotice(d.kind === 'batch' ? this.service.runPayoutBatch() : this.service.settle(d.id));
  }

  exportCsv() {
    const date = new DatePipe('en-US');
    const esc = (v: string | number) => {
      let s = String(v);
      // Stops spreadsheet formulas in names or references from running when the file is opened.
      if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const head = [
      'Transaction ID',
      'Type',
      'Party',
      'Reference',
      'Amount (KSh)',
      'Fee (KSh)',
      'Net (KSh)',
      'Status',
      'Date',
    ];
    const lines = this.filtered().map((t) =>
      [
        t.id,
        TXN_TYPE_LABEL[t.type],
        t.party,
        t.reference,
        t.amount,
        t.fee,
        t.net,
        TXN_STATUS_LABEL[t.status],
        date.transform(t.createdAt, 'yyyy-MM-dd') ?? '',
      ]
        .map(esc)
        .join(','),
    );
    const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${date.transform(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  dismissNotice() {
    clearTimeout(this.noticeTimer);
    this.notice.set(null);
  }

  private showNotice(r: PayResult) {
    clearTimeout(this.noticeTimer);
    this.notice.set(r);
    this.noticeTimer = setTimeout(() => this.notice.set(null), 6000);
    this.destroyRef.onDestroy(() => clearTimeout(this.noticeTimer));
  }
}
