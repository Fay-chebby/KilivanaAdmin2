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

  // Dialog state
  selected = signal<Buyer | null>(null);
  action = signal<DialogAction | null>(null);
  processing = signal(false);

  // Suspension reason
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
        b.code.toLowerCase().includes(q) ||
        b.region.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  });

  dialogTitle = computed(() => {
    const map: Record<DialogAction, string> = {
      suspend: 'Suspend buyer',
      verify: 'Verify buyer',
      reactivate: 'Reactivate buyer',
      delete: 'Delete buyer',
    };

    const currentAction = this.action();

    return currentAction ? map[currentAction] : '';
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
  }

  onFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as 'all' | BuyerStatus);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }

  avatarColor(name: string): string {
    const colors = ['#16a34a', '#2563eb', '#9333ea', '#ea580c', '#0891b2', '#db2777'];

    let hash = 0;

    for (const c of name) {
      hash = (hash * 31 + c.charCodeAt(0)) | 0;
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

    // Clear old suspension reason
    this.suspensionReason.set('');
  }

  onSuspensionReasonChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;

    this.suspensionReason.set(value);
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

    // Validate suspension reason
    if (action === 'suspend') {
      const reason = this.suspensionReason().trim();

      if (!reason) {
        this.error.set('Please provide a reason for suspending the buyer.');
        return;
      }
    }

    this.processing.set(true);
    this.error.set(null);

    // DELETE
    if (action === 'delete') {
      this.buyerService.delete(b.id).subscribe({
        next: () => {
          this.buyers.update((list) => list.filter((x) => x.id !== b.id));

          this.finish();
        },

        error: (error) => {
          console.error('Failed to delete buyer:', error);

          const message =
            error?.error?.message ||
            error?.error?.error?.details ||
            error?.message ||
            'Failed to delete buyer.';

          this.fail(message);
        },
      });

      return;
    }

    // VERIFY
    if (action === 'verify') {
      this.fail('Verification is not connected to the backend yet.');

      return;
    }

    const status: BuyerStatus = action === 'suspend' ? 'suspended' : 'verified';

    // SUSPEND / REACTIVATE
    const request$ =
      action === 'suspend'
        ? this.buyerService.suspend(b.id, this.suspensionReason().trim())
        : this.buyerService.reactivate(b.id);

    request$.subscribe({
      next: () => {
        this.buyers.update((list) =>
          list.map((x) =>
            x.id === b.id
              ? {
                  ...x,
                  status,
                }
              : x,
          ),
        );

        this.finish();
      },

      error: (error) => {
        console.error(`Failed to ${action} buyer:`, error);

        const message =
          error?.error?.message ||
          error?.error?.error?.details ||
          error?.message ||
          `Failed to ${action} buyer.`;

        this.fail(message);
      },
    });
  }

  private finish(): void {
    this.processing.set(false);
    this.selected.set(null);
    this.action.set(null);
    this.suspensionReason.set('');
  }

  private fail(msg: string): void {
    this.processing.set(false);
    this.error.set(msg);
    this.selected.set(null);
    this.action.set(null);
    this.suspensionReason.set('');
  }
}
