import { Component, computed, input, signal } from '@angular/core';

export interface ChartPoint {
  label: string;
  value: number;
  display: string;
}

/** Rounds the top of the axis to a clean number and returns 4 equal steps. */
function niceScale(max: number): { top: number; ticks: number[] } {
  const rough = Math.max(max, 1) / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((c) => c * mag).find((s) => s >= rough) ?? 10 * mag;
  return { top: step * 4, ticks: [0, 1, 2, 3, 4].map((i) => i * step) };
}

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  templateUrl: './revenue-chart.html',
  styleUrl: './revenue-chart.scss',
})
export class RevenueChart {
  points = input.required<ChartPoint[]>();
  title = input('Monthly revenue');
  valueHeader = input('Revenue');

  showTable = signal(false);

  readonly scale = computed(() => niceScale(Math.max(...this.points().map((p) => p.value))));
  readonly bars = computed(() => {
    const { top } = this.scale();
    return this.points().map((p, i, all) => ({
      ...p,
      pct: (p.value / top) * 100,
      last: i === all.length - 1,
    }));
  });

  axisLabel(v: number) {
    return v >= 1000 ? `${v / 1000}k` : `${v}`;
  }
}
