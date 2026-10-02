import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Order, loadKg } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-assign-driver-dialog',
  templateUrl: './assign-driver-dialog.html',
  styleUrl: './assign-driver-dialog.scss',
})
export class AssignDriverDialog {
  private readonly service = inject(OrderService);

  readonly order = input.required<Order>();
  readonly assigned = output<string>();
  readonly cancelled = output<void>();

  protected readonly selected = signal<string | null>(null);
  protected readonly load = computed(() => loadKg(this.order()));

  /** Drivers who can take the job first, then the closest to the farm, then the least busy */
  protected readonly options = computed(() =>
    this.service
      .agents()
      .map((a) => {
        const fits = a.capacityKg >= this.load();
        const reason = !a.available
          ? 'Unavailable'
          : !fits
            ? `Too small for ${this.load().toLocaleString('en-KE')} kg`
            : '';
        return {
          a,
          near: a.county === this.order().farmer.county,
          busy: this.service.agentLoad(a.id),
          reason,
          ok: !reason,
          current: a.id === this.order().delivery?.agentId,
        };
      })
      .sort(
        (x, y) => Number(y.ok) - Number(x.ok) || Number(y.near) - Number(x.near) || x.busy - y.busy,
      ),
  );
}
