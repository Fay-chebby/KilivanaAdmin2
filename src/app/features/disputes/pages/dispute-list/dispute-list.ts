import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';

import { DisputePanel } from '../../components/dispute-panel/dispute-panel';

import {
  ResolveDisputeDialog,
  ResolveResult,
} from '../../components/resolve-dispute-dialog/resolve-dispute-dialog';

import { Dispute, DisputeStatus, STATUS_META, slaInfo } from '../../models/dispute.model';

import { DisputeService } from '../../services/dispute.service';

type Tab = 'all' | DisputeStatus;

@Component({
  selector: 'app-dispute-list',
  imports: [RouterLink, StatCard, CurrencyKshPipe, DisputePanel, ResolveDisputeDialog],
  templateUrl: './dispute-list.html',
  styleUrl: './dispute-list.scss',
})
export class DisputeList {
  protected readonly service = inject(DisputeService);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly tab = signal<Tab>('all');

  protected readonly search = signal('');

  /*
   * Dispute IDs are numbers.
   *
   * The query parameter is a string, so convert it to a number.
   */
  protected readonly selectedId = signal<number | null>(this.getSelectedOrderId());

  protected readonly resolving = signal<Dispute | null>(null);

  protected readonly stats = this.service.stats;

  protected readonly meta = STATUS_META;

  protected readonly tabs = computed(() => {
    const disputes = this.service.disputes();

    const count = (status: DisputeStatus) => disputes.filter((d) => d.status === status).length;

    return [
      {
        id: 'all' as Tab,
        label: 'All',
        count: disputes.length,
      },
      {
        id: 'open' as Tab,
        label: 'Open',
        count: count('open'),
      },
      {
        id: 'in_review' as Tab,
        label: 'In review',
        count: count('in_review'),
      },
      {
        id: 'escalated' as Tab,
        label: 'Escalated',
        count: count('escalated'),
      },
      {
        id: 'resolved' as Tab,
        label: 'Resolved',
        count: count('resolved'),
      },
    ];
  });

  /**
   * Unresolved first, escalated at the top,
   * then the nearest deadline.
   */
  protected readonly rows = computed(() => {
    const q = this.search().toLowerCase().trim();

    const rank: Record<DisputeStatus, number> = {
      escalated: 0,
      open: 1,
      in_review: 2,
      resolved: 3,
    };

    return this.service
      .disputes()
      .filter(
        (d) =>
          (this.tab() === 'all' || d.status === this.tab()) &&
          (!q ||
            [d.code, d.orderCode, d.buyer.name, d.farmer.name].some((value) =>
              value.toLowerCase().includes(q),
            )),
      )
      .sort(
        (a, b) => rank[a.status] - rank[b.status] || a.slaDeadline.localeCompare(b.slaDeadline),
      );
  });

  protected readonly selected = computed(
    () => this.rows().find((d) => d.id === this.selectedId()) ?? this.rows()[0] ?? null,
  );

  protected sla(d: Dispute) {
    return slaInfo(d, this.service.clock());
  }

  protected select(id: number): void {
    this.selectedId.set(id);
  }

  protected open(id: number): void {
    this.router.navigate(['/disputes', id]);
  }

  protected resolve(r: ResolveResult): void {
    const dispute = this.resolving();

    if (dispute) {
      this.service.resolve(dispute.id, r.outcome, r.note, r.refundKes);
    }

    this.resolving.set(null);
  }

  /**
   * Query parameters are always strings.
   * Convert ?order=123 into number 123.
   */
  private getSelectedOrderId(): number | null {
    const value = this.route.snapshot.queryParamMap.get('order');

    if (!value) {
      return null;
    }

    const id = Number(value);

    return Number.isNaN(id) ? null : id;
  }
}
