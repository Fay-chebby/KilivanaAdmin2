import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ChartPoint } from '../../models/report.model';

let nextId = 0;
const niceMax = (v: number) => {
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};

@Component({
  selector: 'app-report-chart',
  templateUrl: './report-chart.html',
  styleUrl: './report-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportChart {
  readonly data = input.required<ChartPoint[]>();
  readonly type = input<'line' | 'bar'>('line');
  readonly valueType = input<'currency' | 'number'>('number');
  readonly color = input('#16a34a');
  readonly ariaLabel = input('Chart');

  readonly W = 600;
  readonly H = 260;
  private readonly pad = { l: 46, r: 10, t: 12, b: 28 };
  readonly uid = `rc-grad-${nextId++}`;
  readonly hover = signal<number | null>(null);

  private readonly innerW = this.W - this.pad.l - this.pad.r;
  private readonly innerH = this.H - this.pad.t - this.pad.b;
  readonly baseline = this.H - this.pad.b;
  readonly left = this.pad.l;
  readonly right = this.W - this.pad.r;

  readonly yMax = computed(() => niceMax(Math.max(...this.data().map((d) => d.value), 1)));
  private y = (v: number) => this.baseline - (v / this.yMax()) * this.innerH;

  readonly ticks = computed(() =>
    [0, 1, 2, 3, 4].map((i) => {
      const value = (this.yMax() * i) / 4;
      return { value, y: this.y(value) };
    }),
  );

  readonly band = computed(() => this.innerW / Math.max(this.data().length, 1));
  readonly barW = computed(() => this.band() * 0.58);
  readonly labelEvery = computed(() => Math.ceil(this.data().length / 7));

  readonly points = computed(() =>
    this.data().map((d, i) => ({
      ...d,
      i,
      x: this.pad.l + this.band() * (i + 0.5),
      y: this.y(d.value),
      h: this.baseline - this.y(d.value),
    })),
  );

  readonly linePath = computed(() => {
    const p = this.points();
    if (!p.length) return '';
    let d = `M${p[0].x},${p[0].y}`;
    for (let i = 1; i < p.length; i++) {
      const mx = (p[i - 1].x + p[i].x) / 2;
      d += ` C${mx},${p[i - 1].y} ${mx},${p[i].y} ${p[i].x},${p[i].y}`;
    }
    return d;
  });

  readonly areaPath = computed(() => {
    const p = this.points();
    return p.length
      ? `${this.linePath()} L${p[p.length - 1].x},${this.baseline} L${p[0].x},${this.baseline} Z`
      : '';
  });

  readonly active = computed(() => {
    const i = this.hover();
    return i === null ? null : (this.points()[i] ?? null);
  });

  axis(v: number) {
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
  }

  full(v: number) {
    const s = v.toLocaleString('en');
    return this.valueType() === 'currency' ? `GH₵ ${s}` : s;
  }
}
