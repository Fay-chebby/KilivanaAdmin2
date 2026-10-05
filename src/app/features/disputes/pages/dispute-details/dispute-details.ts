import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DisputePanel } from '../../components/dispute-panel/dispute-panel';
import {
  ResolveDisputeDialog,
  ResolveResult,
} from '../../components/resolve-dispute-dialog/resolve-dispute-dialog';
import { DisputeService } from '../../services/dispute.service';

@Component({
  selector: 'app-dispute-details',
  imports: [RouterLink, DisputePanel, ResolveDisputeDialog],
  templateUrl: './dispute-details.html',
  styleUrl: './dispute-details.scss',
})
export class DisputeDetails {
  private readonly service = inject(DisputeService);
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly dispute = computed(() => this.service.get(this.id));
  protected readonly resolving = signal(false);

  protected resolve(r: ResolveResult) {
    this.service.resolve(this.id, r.outcome, r.note, r.refundKes);
    this.resolving.set(false);
  }
}
