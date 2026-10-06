import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FarmerService, apiError } from '../../services/farmer.service';
import { FarmerFilters } from '../../components/farmer-filters/farmer-filters';
import { FarmerBadge } from '../../components/farmer-badge/Farmer badge ';
import { FarmerActionDialog } from '../../components/farmer-action-dialog/farmer-action-dialog';
import {
  Farmer,
  FarmerAction,
  FarmerFilterValue,
  STATUS_LABEL,
  avatarColor,
  initials,
  statusTone,
} from '../../models/farmer.model';

@Component({
  selector: 'app-farmer-list',
  imports: [RouterLink, DatePipe, FarmerFilters, FarmerBadge, FarmerActionDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './farmer-list.html',
  styleUrl: './farmer-list.scss',
})
export class FarmerList {
  private readonly service = inject(FarmerService);
  private readonly router = inject(Router);

  readonly statusLabel = STATUS_LABEL;
  readonly statusTone = statusTone;
  readonly initials = initials;
  readonly avatarColor = avatarColor;

  readonly loading = this.service.loading;
  readonly loadError = this.service.loadError;

  readonly pageSize = 10;
  readonly filters = signal<FarmerFilterValue>({ search: '', region: '', status: '' });
  readonly page = signal(1);
  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly dialog = signal<{ action: FarmerAction; farmer: Farmer } | null>(null);
  readonly busy = signal(false);
  readonly actionError = signal<string | null>(null);

  constructor() {
    this.service.load();
  }

  readonly regions = computed(() =>
    [
      ...new Set(
        this.service
          .farmers()
          .map((f) => f.region)
          .filter(Boolean),
      ),
    ].sort(),
  );

  readonly statCards = computed(() => {
    const s = this.service.stats();
    const wait = this.loading();
    const pct = (n: number) => (s.total ? Math.round((n / s.total) * 100) : 0);
    const v = (n: number) => (wait ? '–' : String(n));
    return [
      {
        label: 'Total Farmers',
        value: v(s.total),
        hint: 'Registered on the platform',
        tone: 'neutral',
        icon: 'users',
      },
      {
        label: 'Verified',
        value: v(s.verified),
        hint: `${pct(s.verified)}% of all farmers`,
        tone: 'green',
        icon: 'check',
      },
      {
        label: 'Pending Approval',
        value: v(s.pending),
        hint: 'Waiting for your review',
        tone: 'amber',
        icon: 'clock',
      },
      {
        label: 'Suspended',
        value: v(s.suspended),
        hint: 'Access currently blocked',
        tone: 'red',
        icon: 'ban',
      },
    ];
  });

  readonly filtered = computed(() => {
    const { search, region, status } = this.filters();
    const q = search.trim().toLowerCase();
    return this.service
      .farmers()
      .filter(
        (f) =>
          (!q ||
            [f.name, f.email, f.phone, f.code, f.username, f.region].some((v) =>
              (v ?? '').toLowerCase().includes(q),
            )) &&
          (!region || f.region === region) &&
          (!status || f.status === status),
      );
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );
  readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  readonly rows = computed(() => {
    const start = (Math.min(this.page(), this.totalPages()) - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });
  readonly allSelected = computed(
    () => this.rows().length > 0 && this.rows().every((r) => this.selected().has(r.id)),
  );

  retry() {
    this.service.load();
  }
  onFilters(v: FarmerFilterValue) {
    this.filters.set(v);
    this.page.set(1);
  }
  open(f: Farmer) {
    this.router.navigate(['/farmers', f.id]);
  }

  clearSelection() {
    this.selected.set(new Set());
  }
  toggleAll() {
    this.selected.set(this.allSelected() ? new Set() : new Set(this.rows().map((r) => r.id)));
  }
  toggleOne(id: string) {
    const next = new Set(this.selected());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selected.set(next);
  }

  ask(action: FarmerAction, farmer: Farmer, e: Event) {
    e.stopPropagation();
    this.actionError.set(null);
    this.dialog.set({ action, farmer });
  }
  closeDialog() {
    if (!this.busy()) this.dialog.set(null);
  }

  confirm(reason: string) {
    const d = this.dialog();
    if (!d) return;
    this.busy.set(true);
    this.actionError.set(null);
    this.service.applyAction(d.farmer.id, d.action, reason).subscribe({
      next: () => {
        this.busy.set(false);
        this.dialog.set(null);
      },
      error: (e) => {
        this.busy.set(false);
        this.actionError.set(apiError(e));
      },
    });
  }

  exportCsv() {
    const head = ['ID', 'Name', 'Email', 'Phone', 'Username', 'Region', 'Status', 'Joined'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = this.filtered().map((f) =>
      [f.code, f.name, f.email, f.phone, f.username, f.region, STATUS_LABEL[f.status], f.joinedAt]
        .map(esc)
        .join(','),
    );
    const url = URL.createObjectURL(
      new Blob([[head.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'farmers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
