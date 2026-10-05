import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DeliveryTimeline } from '../../../logistics/components/delivery-timeline/delivery-timeline';
import { TrackingMap } from '../../../logistics/components/tracking-map/tracking-map';
import { DeliveryService } from '../../../logistics/services/delivery.service';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [DatePipe, RouterLink, TrackingMap, DeliveryTimeline],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.scss',
})
export class OrderTracking {
  private service = inject(DeliveryService);

  /** :id is the ORDER id. */
  readonly orderId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  readonly delivery = computed(() => this.service.getByOrderId(this.orderId));

  readonly statusText = computed(() => {
    switch (this.delivery()?.status) {
      case 'assigned':
        return 'Waiting for the driver to collect your order from the farm';
      case 'in_transit':
        return 'Your order is on the way';
      case 'arrived':
        return 'The driver has arrived. Share your delivery code to receive your order';
      case 'delivered':
        return 'Delivered';
      case 'failed':
        return 'Delivery failed. We are arranging a new driver';
      default:
        return '';
    }
  });

  /** "123456" becomes "123 456" for readability. */
  readonly spacedCode = computed(() => {
    const v = this.delivery()?.deliveryCode.value ?? '';
    return `${v.slice(0, 3)} ${v.slice(3)}`;
  });

  readonly codeNote = computed(() => {
    const c = this.delivery()?.deliveryCode;
    if (!c) return '';
    if (c.used) return 'This code was used to confirm delivery.';
    if (c.locked)
      return 'This code is locked after too many wrong attempts. Contact support to get a new one.';
    if (Date.parse(c.expiresAt) < Date.now())
      return 'This code has expired. Contact support to get a new one.';
    return '';
  });
}
