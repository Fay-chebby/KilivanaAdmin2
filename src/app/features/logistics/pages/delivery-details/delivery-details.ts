import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DeliveryTimeline } from '../../components/delivery-timeline/delivery-timeline';
import { TrackingMap } from '../../components/tracking-map/tracking-map';
import {
  CodeKind,
  DELIVERY_STATUS_LABEL,
  Delivery,
  VerifyResult,
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
  readonly drivers = this.service.drivers;
  readonly delivery = computed(() => this.service.get(this.id));
  readonly statusLabel = DELIVERY_STATUS_LABEL;
  readonly codeState = codeState;

  demo = signal(false);
  message = signal<VerifyResult | null>(null);
  codeInput = '';
  driverId = '';
  failReason = '';

  reset(d: Delivery, kind: CodeKind) {
    this.message.set(this.service.resetCode(d.id, kind));
  }

  reassign(d: Delivery) {
    this.message.set(this.service.reassign(d.id, this.driverId));
    this.driverId = '';
  }

  fail(d: Delivery) {
    const r = this.service.markFailed(d.id, this.failReason);
    this.message.set(r);
    if (r.ok) this.failReason = '';
  }

  /** Demo only: stands in for the driver's mobile app. */
  verify(d: Delivery, kind: CodeKind) {
    const r = this.service.verify(d.id, kind, this.codeInput);
    this.message.set(r);
    if (r.ok) this.codeInput = '';
  }

  canReassign(d: Delivery) {
    return d.status === 'assigned' || d.status === 'failed';
  }
  canFail(d: Delivery) {
    return d.status !== 'delivered' && d.status !== 'failed';
  }
}
