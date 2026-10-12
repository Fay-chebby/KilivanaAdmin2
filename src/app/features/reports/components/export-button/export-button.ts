import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ExportFormat } from '../../models/report.model';

@Component({
  selector: 'app-export-button',
  templateUrl: './export-button.html',
  styleUrl: './export-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'onDocClick($event)', '(keydown.escape)': 'open.set(false)' },
})
export class ExportButton {
  readonly label = input('Export');
  readonly loading = input(false);
  readonly align = input<'start' | 'end'>('start');
  readonly formats = input<ExportFormat[]>(['csv', 'xlsx', 'pdf']);
  readonly exportRequested = output<ExportFormat>();

  readonly open = signal(false);
  readonly names: Record<ExportFormat, string> = {
    csv: 'CSV (.csv)',
    xlsx: 'Excel (.xlsx)',
    pdf: 'PDF (.pdf)',
  };
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  pick(format: ExportFormat) {
    this.open.set(false);
    this.exportRequested.emit(format);
  }

  onDocClick(e: Event) {
    if (!this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}
