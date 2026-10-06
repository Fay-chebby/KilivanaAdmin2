import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BuyerService } from '../../services/buyer.service';
import { Buyer, BuyerStatus } from '../../models/buyer.model';
import { BuyerActionDialog } from '../../components/buyer-action-dialog/buyer-action-dialog';

type DialogAction = 'suspend' | 'verify' | 'reactivate' | 'delete';

@Component({
  selector: 'app-buyer-details',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, BuyerActionDialog],
  templateUrl: './buyer-details.html',
  styleUrl: './buyer-details.scss',
})
export class BuyerDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private buyerService = inject(BuyerService);

  buyer = signal<Buyer | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  action = signal<DialogAction | null>(null);
  processing = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('Buyer ID is missing.');
      this.loading.set(false);
      return;
    }

    this.buyerService.getById(id).subscribe({
      next: (b) => {
        this.buyer.set(b);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Buyer not found.');
        this.loading.set(false);
      },
    });
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

  dialogMessage(): string {
    const name = this.buyer()?.name ?? '';

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
  }

  confirm(): void {
    const b = this.buyer();
    const action = this.action();

    if (!b || !action) {
      return;
    }

    this.processing.set(true);
    this.error.set(null);

    if (action === 'delete') {
      this.buyerService.delete(b.id).subscribe({
        next: () => {
          this.router.navigate(['/buyers']);
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

    if (action === 'verify') {
      this.fail('Verification is not connected to the backend yet.');
      return;
    }

    const status: BuyerStatus = action === 'suspend' ? 'suspended' : 'verified';

    const request$ =
      action === 'suspend'
        ? this.buyerService.suspend(b.id, 'Suspended by administrator')
        : this.buyerService.reactivate(b.id);

    request$.subscribe({
      next: () => {
        this.buyer.set({
          ...b,
          status,
        });

        this.processing.set(false);
        this.action.set(null);
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

  openDialog(action: DialogAction): void {
    this.action.set(action);
    this.error.set(null);
  }

  closeDialog(): void {
    if (this.processing()) {
      return;
    }

    this.action.set(null);
  }

  private fail(msg: string): void {
    this.processing.set(false);
    this.action.set(null);
    this.error.set(msg);
  }
}
