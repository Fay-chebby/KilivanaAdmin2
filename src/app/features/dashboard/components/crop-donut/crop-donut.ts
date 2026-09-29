import { Component, computed, input } from '@angular/core';
import { Panel } from '../../../../shared/components/panel/panel';
import { CropSlice } from '../../models/dashboard.model';

const COLORS = ['#15803d', '#22c55e', '#86efac', '#bbf7d0', '#f59e0b', '#d1d5db'];

@Component({
  selector: 'app-crop-donut',
  imports: [Panel],
  templateUrl: './crop-donut.html',
  styleUrl: './crop-donut.scss',
})
export class CropDonut {
  readonly slices = input.required<CropSlice[]>();

  protected readonly radius = 52;
  private readonly circumference = 2 * Math.PI * this.radius;

  /** One stroked circle per slice, each drawn with a dash length + offset. */
  protected readonly segments = computed(() => {
    const gap = 2;
    let offset = 0;
    return this.slices().map((s, i) => {
      const length = (s.percent / 100) * this.circumference;
      const seg = {
        ...s,
        color: COLORS[i % COLORS.length],
        dash: `${Math.max(length - gap, 0)} ${this.circumference}`,
        offset: -offset,
      };
      offset += length;
      return seg;
    });
  });
}
