import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Delivery, EventKey } from '../../models/delivery.model';

const STEPS: { key: EventKey; label: string }[] = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'in_transit', label: 'On the way' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'delivered', label: 'Delivered' },
];

@Component({
  selector: 'app-delivery-timeline',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './delivery-timeline.html',
  styleUrl: './delivery-timeline.scss',
})
export class DeliveryTimeline {
  delivery = input.required<Delivery>();
  steps = computed(() =>
    STEPS.map((st) => ({
      ...st,
      at: this.delivery().events.find((e) => e.key === st.key)?.at ?? null,
    })),
  );
  failure = computed(() =>
    this.delivery().status === 'failed' ? this.delivery().failureReason : null,
  );
}
