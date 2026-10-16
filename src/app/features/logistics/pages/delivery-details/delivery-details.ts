import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DeliveryTimeline } from '../../components/delivery-timeline/delivery-timeline';
import { TrackingMap } from '../../components/tracking-map/tracking-map';
import {
  ActionResult,
  DELIVERY_STATUS_LABEL,
  Delivery,
  codeState,
} from '../../models/delivery.model';
import { DeliveryService } from '../../services/delivery.service';

@Component({
  selector: 'app-delivery-details',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, TrackingMap, DeliveryTimeline],
  templateUrl: './delivery-details.html',
  styleUrl: './delivery-details.scss',
})
export class DeliveryDetails {
  private service = inject(DeliveryService);

  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  readonly drivers = this.service.availableDrivers;
  readonly delivery = computed(() => this.service.get(this.id));
  readonly loading = this.service.loading;
  readonly error = this.service.error;
  readonly statusLabel = DELIVERY_STATUS_LABEL;
  readonly codeState = codeState;

  demo = signal(false);
  busy = signal(false);
  message = signal<ActionResult | null>(null);
  codeInput = '';
  recipient = '';
  driverId = '';
  failReason = '';

  constructor() {
    void this.service.loadOne(this.id);
    this.service.watchLive(inject(DestroyRef));
  }

  private async run(p: Promise<ActionResult>) {
    this.busy.set(true);
    try {
      const r = await p;
      this.message.set(r);
      return r;
    } finally {
      this.busy.set(false);
    }
  }

  async assign(d: Delivery) {
    if (!this.driverId) {
      this.message.set({ ok: false, message: 'Pick a driver first.' });
      return;
    }
    const r = await this.run(this.service.assign(d.id, Number(this.driverId)));
    if (r.ok) this.driverId = '';
  }

  async cancel(d: Delivery) {
    const r = await this.run(this.service.cancel(d.id, this.failReason));
    if (r.ok) this.failReason = '';
  }

  /** Demo only: stands in for the driver's mobile app. */
  pickup(d: Delivery) {
    return this.run(this.service.confirmPickup(d.id));
  }

  async deliver(d: Delivery) {
    const r = await this.run(this.service.confirmDelivery(d.id, this.codeInput, this.recipient));
    if (r.ok) this.codeInput = '';
  }

  canAssign(d: Delivery) {
    return d.status === 'pending';
  }
  canCancel(d: Delivery) {
    return d.status !== 'delivered' && d.status !== 'failed';
  }
  canPickup(d: Delivery) {
    return d.status === 'assigned' && d.rawStatus !== 'assigned';
  }
}
