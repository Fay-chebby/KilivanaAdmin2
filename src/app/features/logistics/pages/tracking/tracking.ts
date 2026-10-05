import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DeliveryTimeline } from '../../components/delivery-timeline/delivery-timeline';
import { TrackingMap } from '../../components/tracking-map/tracking-map';
import { DELIVERY_STATUS_LABEL } from '../../models/delivery.model';
import { DeliveryService } from '../../services/delivery.service';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [RouterLink, TrackingMap, DeliveryTimeline],
  templateUrl: './tracking.html',
  styleUrl: './tracking.scss',
})
export class Tracking {
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  private service = inject(DeliveryService);
  readonly delivery = computed(() => this.service.get(this.id));
  readonly statusLabel = DELIVERY_STATUS_LABEL;
}
