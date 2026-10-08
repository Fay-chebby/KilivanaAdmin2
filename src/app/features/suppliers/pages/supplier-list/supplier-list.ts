import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SUPPLIER_CATEGORIES, Supplier, SupplierStatus } from '../../models/supplier.model';
import { SupplierService, errorMessage } from '../../services/supplier.service';
import { StatCard, StatTone } from '../../../../shared/components/stat-card/stat-card';
import { SupplierActionDialog } from '../../components/supplier-action-dialog/supplier-action-dialog';

type DialogState = { type: 'delete' | 'suspend' | 'activate'; supplier: Supplier } | null;

@Component({
  selector: 'app-supplier-list',
  imports: [RouterLink, SupplierActionDialog, StatCard],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.scss',
})
export class SupplierList {
  private svc = inject(SupplierService);

  readonly categories = SUPPLIER_CATEGORIES;
  readonly pageSize = 8;
  readonly notice = this.svc.notice;

  search = signal('');
  status = signal<'all' | SupplierStatus>('all');
  category = signal('all');
  page = signal(1);
  dialog = signal<DialogState>(null);
  busy = signal(false);
  actionError = signal<string | null>(null);
  readonly loading = this.svc.loading;
  readonly loadError = this.svc.loadError;

  constructor() {
    this.svc.load();
  }
  reload() {
    this.svc.load();
  }

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.svc
      .suppliers()
      .filter(
        (s) =>
          (this.status() === 'all' || s.status === this.status()) &&
          (this.category() === 'all' || s.category === this.category()) &&
          (!q ||
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            s.contactPerson.toLowerCase().includes(q)),
      );
  });

  /** Change the icon names below to match your Icon component's names */
  statCards = computed(() => {
    const all = this.svc.suppliers();
    const count = (st: SupplierStatus) => all.filter((s) => s.status === st).length;
    return [
      {
        key: 'all' as const,
        label: 'Total Suppliers',
        value: String(all.length),
        icon: 'suppliers',
        tone: 'blue' as StatTone,
      },
      {
        key: 'active' as const,
        label: 'Active',
        value: String(count('active')),
        icon: 'check',
        tone: 'green' as StatTone,
      },
      {
        key: 'pending' as const,
        label: 'Pending',
        value: String(count('pending')),
        icon: 'clock',
        tone: 'amber' as StatTone,
      },
      {
        key: 'suspended' as const,
        label: 'Suspended',
        value: String(count('suspended')),
        icon: 'ban',
        tone: 'red' as StatTone,
      },
    ];
  });

  filterBy(key: 'all' | SupplierStatus) {
    this.status.set(this.status() === key ? 'all' : key);
    this.page.set(1);
  }

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  paged = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  onSearch(e: Event) {
    this.search.set((e.target as HTMLInputElement).value);
    this.page.set(1);
  }
  onStatus(e: Event) {
    this.status.set((e.target as HTMLSelectElement).value as 'all' | SupplierStatus);
    this.page.set(1);
  }
  onCategory(e: Event) {
    this.category.set((e.target as HTMLSelectElement).value);
    this.page.set(1);
  }
  go(p: number) {
    this.page.set(Math.min(Math.max(1, p), this.totalPages()));
  }

  initials(name: string | null | undefined): string {
    if (!name) {
      return 'SU';
    }

    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      return 'SU';
    }

    return words
      .slice(0, 2)
      .map((w) => w.charAt(0))
      .join('')
      .toUpperCase();
  }

  open(type: 'delete' | 'suspend' | 'activate', supplier: Supplier) {
    this.dialog.set({ type, supplier });
  }

  confirm(reason: string) {
    const d = this.dialog();
    if (!d) return;
    this.busy.set(true);
    this.actionError.set(null);
    const call$ =
      d.type === 'delete'
        ? this.svc.delete$(d.supplier)
        : d.type === 'suspend'
          ? this.svc.suspend$(d.supplier, reason)
          : this.svc.activate$(d.supplier);
    call$.subscribe({
      next: () => {
        this.busy.set(false);
        this.dialog.set(null);
      },
      error: (e) => {
        this.busy.set(false);
        this.dialog.set(null);
        this.actionError.set(errorMessage(e));
      },
    });
  }
}
