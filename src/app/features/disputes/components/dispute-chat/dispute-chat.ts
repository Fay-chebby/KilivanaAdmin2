import {
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DisputeNote, timeAgo } from '../../models/dispute.model';
import { DisputeService } from '../../services/dispute.service';

export type PostMode = 'internal' | 'buyer' | 'farmer';

@Component({
  selector: 'app-dispute-chat',
  templateUrl: './dispute-chat.html',
  styleUrl: './dispute-chat.scss',
})
export class DisputeChat {
  private readonly service = inject(DisputeService);
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');

  readonly notes = input.required<DisputeNote[]>();
  readonly locked = input(false);
  readonly posted = output<{ text: string; mode: PostMode }>();

  protected readonly text = signal('');
  protected readonly mode = signal<PostMode>('internal');
  protected readonly modes: { id: PostMode; label: string }[] = [
    { id: 'internal', label: 'Internal note' },
    { id: 'buyer', label: 'To buyer' },
    { id: 'farmer', label: 'To farmer' },
  ];

  constructor() {
    effect(() => {
      this.notes();
      queueMicrotask(() => {
        const el = this.list()?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }

  protected ago(at: string) {
    return timeAgo(at, this.service.clock());
  }

  protected send() {
    const t = this.text().trim();
    if (!t) return;
    this.posted.emit({ text: t, mode: this.mode() });
    this.text.set('');
  }
}
