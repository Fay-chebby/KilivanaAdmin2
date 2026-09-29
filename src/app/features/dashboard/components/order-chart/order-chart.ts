import { Component, computed, input, signal } from '@angular/core';
import { Panel } from '../../../../shared/components/panel/panel';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-ghs-pipe';
import { OrderTrendPoint } from '../../models/dashboard.model';

@Component({
  selector: 'app-order-chart',
  imports: [Panel],
  templateUrl: './order-chart.html',
  styleUrl: './order-chart.scss',
})
export class OrderChart {
  readonly data = input.required<OrderTrendPoint[]>();

  /** SVG canvas + padding (the svg scales to the panel width). */
  protected readonly W = 600;
  protected readonly H = 230;
  protected readonly L = 34;
  protected readonly R = 10;
  protected readonly T = 10;
  protected readonly B = 26;

  protected readonly hovered = signal<number | null>(null);

  /** Rounds the top of the axis up to the next multiple of 40 (160 in the design). */
  protected readonly yMax = computed(() => {
    const max = Math.max(...this.data().map((d) => d.orders), 40);
    return Math.ceil(max / 40) * 40;
  });

  protected readonly ticks = computed(() => [0, 1, 2, 3, 4].map((i) => (this.yMax() / 4) * i));

  protected readonly points = computed(() => {
    const d = this.data();
    const innerW = this.W - this.L - this.R;
    return d.map((p, i) => ({
      ...p,
      x: this.L + (d.length > 1 ? (innerW * i) / (d.length - 1) : innerW / 2),
      y: this.y(p.orders),
    }));
  });

  protected readonly step = computed(() => {
    const n = this.data().length;
    return n > 1 ? (this.W - this.L - this.R) / (n - 1) : this.W - this.L - this.R;
  });

  /** Smooth curve: each segment is a cubic bezier with horizontal tangents. */
  protected readonly linePath = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    let d = `M${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const mid = (a.x + b.x) / 2;
      d += ` C${mid} ${a.y} ${mid} ${b.y} ${b.x} ${b.y}`;
    }
    return d;
  });

  protected readonly areaPath = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    const base = this.H - this.B;
    return `${this.linePath()} L${pts[pts.length - 1].x} ${base} L${pts[0].x} ${base} Z`;
  });

  protected readonly hoverPoint = computed(() => {
    const i = this.hovered();
    return i === null ? null : (this.points()[i] ?? null);
  });

  protected readonly tipOnLeft = computed(() => (this.hovered() ?? 0) > this.data().length / 2);

  protected y(value: number): number {
    const innerH = this.H - this.T - this.B;
    return this.T + innerH - (value / this.yMax()) * innerH;
  }

  protected readonly ghs = new CurrencyKshPipe();
}
