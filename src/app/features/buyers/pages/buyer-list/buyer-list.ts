import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { BuyerService } from '../../services/buyer.service';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { Buyer, BuyerStats, BuyerStatus } from '../../models/buyer.model';
import { BuyerActionDialog } from '../../components/buyer-action-dialog/buyer-action-dialog';

type DialogAction = 'suspend' | 'verify' | 'reactivate' | 'delete';

@Component({
  selector: 'app-buyer-list',
  standalone: true,
  imports: [DecimalPipe, BuyerActionDialog, StatCard, RouterLink],
  templateUrl: './buyer-list.html',
  styleUrl: './buyer-list.scss',
})
export class BuyerList implements OnInit {
  private buyerService = inject(BuyerService);
  private router = inject(Router);

  buyers = signal<Buyer[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  search = signal('');
  statusFilter = signal<'all' | BuyerStatus>('all');

  // Pagination
  readonly pageSize = 10;
  readonly page = signal(1);
  readonly Math = Math;

  // Dialog state
  selected = signal<Buyer | null>(null);
  action = signal<DialogAction | null>(null);
  processing = signal(false);
  suspensionReason = signal('');

  stats = computed<BuyerStats>(() => {
    const list = this.buyers();

    return {
      total: list.length,
      verified: list.filter((b) => b.status === 'verified').length,
      pending: list.filter((b) => b.status === 'pending').length,
      suspended: list.filter((b) => b.status === 'suspended').length,
      totalSpend: list.reduce((sum, b) => sum + b.totalSpend, 0),
    };
  });

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const status = this.statusFilter();

    return this.buyers().filter((b) => {
      const matchesStatus = status === 'all' || b.status === status;

      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        (b.code ?? '').toLowerCase().includes(q) ||
        (b.region ?? '').toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  });

  // Total number of pages after filtering
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );

  // Page numbers: 1, 2, 3...
  readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  // Only the 10 buyers belonging to the current page
  readonly rows = computed(() => {
    const currentPage = Math.min(this.page(), this.totalPages());
    const start = (currentPage - 1) * this.pageSize;

    return this.filtered().slice(start, start + this.pageSize);
  });

  dialogTitle = computed(() => {
    const titles: Record<DialogAction, string> = {
      suspend: 'Suspend buyer',
      verify: 'Verify buyer',
      reactivate: 'Reactivate buyer',
      delete: 'Delete buyer',
    };

    const currentAction = this.action();

    return currentAction ? titles[currentAction] : '';
  });

  dialogMessage = computed(() => {
    const name = this.selected()?.name ?? '';

    switch (this.action()) {
      case 'suspend':
        return `${name} will no longer be able to place orders.`;
      case 'verify':
        return `Mark ${name} as a verified buyer?`;
      case 'reactivate':
        return `Restore access for ${name}?`;
      case 'delete':
        return `This permanently deletes ${name}. This cannot be undone.`;
      default:
        return '';
    }
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.buyerService.getAll().subscribe({
      next: (data) => {
        this.buyers.set(data);
        this.page.set(1);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load buyers:', error);
        this.error.set(error?.error?.message || error?.message || 'Failed to load buyers.');
        this.loading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  onFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as 'all' | BuyerStatus);
    this.page.set(1);
  }

  goToPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.totalPages()) {
      return;
    }

    this.page.set(pageNumber);
  }

  previousPage(): void {
    this.goToPage(this.page() - 1);
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  avatarColor(name: string): string {
    const colors = ['#16a34a', '#2563eb', '#9333ea', '#ea580c', '#0891b2', '#db2777'];

    let hash = 0;

    for (const char of name) {
      hash = (hash * 31 + char.charCodeAt(0)) | 0;
    }

    return colors[Math.abs(hash) % colors.length];
  }

  view(b: Buyer): void {
    this.router.navigate(['/buyers', b.id]);
  }

  openDialog(b: Buyer, action: DialogAction, event?: Event): void {
    event?.stopPropagation();
    this.selected.set(b);
    this.action.set(action);
    this.suspensionReason.set('');
    this.error.set(null);
  }

  closeDialog(): void {
    if (this.processing()) {
      return;
    }

    this.selected.set(null);
    this.action.set(null);
    this.suspensionReason.set('');
  }

  confirm(): void {
    const b = this.selected();
    const action = this.action();

    if (!b || !action) {
      return;
    }

    if (action === 'suspend' && !this.suspensionReason().trim()) {
      this.error.set('Please provide a reason for suspending the buyer.');
      return;
    }

    this.processing.set(true);
    this.error.set(null);

    if (action === 'delete') {
      this.buyerService.delete(b.id).subscribe({
        next: () => {
          this.buyers.update((list) => list.filter((buyer) => buyer.id !== b.id));

          // Keep the current page valid after deleting the last row.
          this.page.set(Math.min(this.page(), this.totalPages()));

          this.finish();
        },
        error: (error) => {
          console.error('Failed to delete buyer:', error);
          this.fail(
            error?.error?.message ||
              error?.error?.error?.details ||
              error?.message ||
              'Failed to delete buyer.',
          );
        },
      });

      return;
    }

    if (action === 'verify') {
      this.fail('Verification is not connected to the backend yet.');
      return;
    }

    const status: BuyerStatus = action === 'suspend' ? 'suspended' : 'verified';

    const request$ =
      action === 'suspend'
        ? this.buyerService.suspend(b.id, this.suspensionReason().trim())
        : this.buyerService.reactivate(b.id);

    request$.subscribe({
      next: () => {
        this.buyers.update((list) =>
          list.map((buyer) => (buyer.id === b.id ? { ...buyer, status } : buyer)),
        );

        this.finish();
      },
      error: (error) => {
        console.error(`Failed to ${action} buyer:`, error);
        this.fail(
          error?.error?.message ||
            error?.error?.error?.details ||
            error?.message ||
            `Failed to ${action} buyer.`,
        );
      },
    });
  }

  private finish(): void {
    this.processing.set(false);
    this.selected.set(null);
    this.action.set(null);
    this.suspensionReason.set('');
  }

  private fail(message: string): void {
    this.processing.set(false);
    this.error.set(message);
    this.selected.set(null);
    this.action.set(null);
    this.suspensionReason.set('');
  }
}
