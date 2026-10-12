import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DateRange, RANGE_PRESETS, RangePreset, rangeFromPreset } from '../../models/report.model';

@Component({
  selector: 'app-report-filters',
  templateUrl: './report-filters.html',
  styleUrl: './report-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFilters {
  readonly range = input.required<DateRange>();
  readonly rangeChange = output<DateRange>();
  readonly presets = RANGE_PRESETS;

  onPreset(preset: RangePreset) {
    this.rangeChange.emit(
      preset === 'custom' ? { ...this.range(), preset } : rangeFromPreset(preset),
    );
  }

  onDate(key: 'from' | 'to', value: string) {
    if (!value) return;
    const next = { ...this.range(), preset: 'custom' as const, [key]: value };
    if (next.from > next.to) return; // ignore invalid ranges
    this.rangeChange.emit(next);
  }
}
