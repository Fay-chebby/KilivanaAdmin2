import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tone } from '../../models/farmer.model';

@Component({
  selector: 'app-farmer-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="b" [attr.data-tone]="tone()"><i></i><ng-content /></span>`,
  styles: [`
    .b { display:inline-flex; align-items:center; gap:5px; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:500; white-space:nowrap; }
    i { width:5px; height:5px; border-radius:50%; background:currentColor; }
    [data-tone='green'] { color:#15803d; background:#ecfdf3; }
    [data-tone='amber'] { color:#c2570c; background:#fff4e5; }
    [data-tone='red']   { color:#dc2626; background:#fef0f0; }
    [data-tone='blue']  { color:#2563eb; background:#eef4ff; }
    [data-tone='gray']  { color:#6b7280; background:#f3f4f6; }
  `],
})
export class FarmerBadge {
  readonly tone = input<Tone>('gray');
}