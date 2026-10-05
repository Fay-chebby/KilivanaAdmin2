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
  protected readonly selectedId = signal<string | null>(
    this.route.snapshot.queryParamMap.get('order'),
  );
  protected readonly resolving = signal<Dispute | null>(null);

  protected readonly stats = this.service.stats;
  protected readonly meta = STATUS_META;

  protected readonly tabs = computed(() => {
    const l = this.service.disputes();
    const n = (s: DisputeStatus) => l.filter((d) => d.status === s).length;
    return [
      { id: 'all' as Tab, label: 'All', count: l.length },
      { id: 'open' as Tab, label: 'Open', count: n('open') },
      { id: 'in_review' as Tab, label: 'In review', count: n('in_review') },
      { id: 'escalated' as Tab, label: 'Escalated', count: n('escalated') },
      { id: 'resolved' as Tab, label: 'Resolved', count: n('resolved') },
    ];
  });

  /** Unresolved first, escalated at the top, then the nearest deadline */
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
            [d.code, d.orderCode, d.buyer.name, d.farmer.name].some((v) =>
              v.toLowerCase().includes(q),
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
  protected select(id: string) {
    this.selectedId.set(id);
  }
  protected open(id: string) {
    this.router.navigate(['/disputes', id]);
  }

  protected resolve(r: ResolveResult) {
    const d = this.resolving();
    if (d) this.service.resolve(d.id, r.outcome, r.note, r.refundKes);
    this.resolving.set(null);
  }
}
