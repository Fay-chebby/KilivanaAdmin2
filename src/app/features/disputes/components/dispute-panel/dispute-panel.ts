import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { readImageFiles } from '../../../../shared/utils/image-files';
import {
  CATEGORY_LABEL,
  Dispute,
  DisputeImage,
  OUTCOME_LABEL,
  STATUS_META,
  slaInfo,
  when,
} from '../../models/dispute.model';
import { DisputeService } from '../../services/dispute.service';
import { DisputeChat, PostMode } from '../dispute-chat/dispute-chat';

const MAX_EVIDENCE = 8;

@Component({
  selector: 'app-dispute-panel',
  imports: [RouterLink, CurrencyKshPipe, DisputeChat],
  templateUrl: './dispute-panel.html',
  styleUrl: './dispute-panel.scss',
})
export class DisputePanel {
  protected readonly service = inject(DisputeService);

  readonly dispute = input.required<Dispute>();
  readonly resolveClick = output<void>();

  protected readonly meta = STATUS_META;
  protected readonly category = CATEGORY_LABEL;
  protected readonly outcome = OUTCOME_LABEL;
  protected readonly when = when;
  protected readonly max = MAX_EVIDENCE;

  protected readonly sla = computed(() => slaInfo(this.dispute(), this.service.clock()));
  protected readonly showEscalate = signal(false);
  protected readonly reason = signal('');
  protected readonly error = signal('');
  protected readonly zoom = signal<DisputeImage | null>(null);

  protected escalate() {
    if (this.reason().trim().length < 5) {
      this.error.set('Add a short reason (at least 5 characters).');
      return;
    }
    this.service.escalate(this.dispute().id, this.reason().trim());
    this.showEscalate.set(false);
    this.reason.set('');
    this.error.set('');
  }

  protected post(e: { text: string; mode: PostMode }) {
    this.service.post(this.dispute().id, e.text, e.mode);
  }

  protected async addEvidence(files: FileList | null) {
    const { items, error } = await readImageFiles(
      files,
      MAX_EVIDENCE - this.dispute().evidence.length,
    );
    this.error.set(error);
    if (items.length) this.service.addEvidence(this.dispute().id, items);
  }
  protected onPick(e: Event) {
    const el = e.target as HTMLInputElement;
    this.addEvidence(el.files);
    el.value = '';
  }
}
