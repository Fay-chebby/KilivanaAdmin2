import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FarmerService } from '../../services/farmer.service';
import { FarmerFilters } from '../../components/farmer-filters/farmer-filters';
import { FarmerBadge } from '../../components/farmer-badge/Farmer badge ';
import { FarmerActionDialog } from '../../components/farmer-action-dialog/farmer-action-dialog';
import {
  Farmer,
  FarmerAction,
  FarmerFilterValue,
  KYC_LABEL,
  STATUS_LABEL,
  avatarColor,
  initials,
  kycTone,
  statusTone,
} from '../../models/farmer.model';

@Component({
  selector: 'app-farmer-list',
  imports: [RouterLink, DecimalPipe, FarmerFilters, FarmerBadge, FarmerActionDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './farmer-list.html',
  styleUrl: './farmer-list.scss',
})
export class FarmerList {
  private readonly service = inject(FarmerService);
  private readonly router = inject(Router);

  // helpers exposed to the template
  readonly statusLabel = STATUS_LABEL;
  readonly kycLabel = KYC_LABEL;
  readonly statusTone = statusTone;
  readonly kycTone = kycTone;
  readonly initials = initials;
  readonly avatarColor = avatarColor;

  readonly pageSize = 8;
  readonly filters = signal<FarmerFilterValue>({ search: '', region: '', status: '' });
  readonly page = signal(1);
  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly dialog = signal<{ action: FarmerAction; farmer: Farmer } | null>(null);

  readonly statCards = computed(() => {
    const s = this.service.stats();
    const pct = (n: number) => (s.total ? Math.round((n / s.total) * 100) : 0);
    return [
      {
        label: 'Total Farmers',
        value: s.total,
        hint: 'Registered on the platform',
        tone: 'neutral',
        icon: 'users',
      },
      {
        label: 'Verified',
        value: s.verified,
        hint: `${pct(s.verified)}% of all farmers`,
        tone: 'green',
        icon: 'check',
      },
      {
        label: 'Pending Approval',
        value: s.pending,
        hint: 'Waiting for your review',
        tone: 'amber',
        icon: 'clock',
      },
      {
        label: 'Suspended',
        value: s.suspended,
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
            [f.name, f.email, f.code, f.region, ...f.crops].some((v) =>
              v.toLowerCase().includes(q),
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
    this.dialog.set({ action, farmer });
  }

  confirm(reason: string) {
    const d = this.dialog();
    if (!d) return;
    const id = d.farmer.id;
    switch (d.action) {
      case 'approve':
        this.service.approve(id);
        break;
      case 'reject':
        this.service.reject(id, reason);
        break;
      case 'suspend':
        this.service.suspend(id, reason);
        break;
      case 'reinstate':
        this.service.reinstate(id);
        break;
    }
    this.dialog.set(null);
  }

  exportCsv() {
    const head = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Region',
      'Crops',
      'Status',
      'KYC',
      'Farms',
      'Rating',
      'Revenue (GHS)',
    ];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = this.filtered().map((f) =>
      [
        f.code,
        f.name,
        f.email,
        f.phone,
        f.region,
        f.crops.join('; '),
        STATUS_LABEL[f.status],
        KYC_LABEL[f.kyc],
        f.farms,
        f.rating,
        f.revenue,
      ]
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
