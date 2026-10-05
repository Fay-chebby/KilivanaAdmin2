import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrackingMap } from '../../components/tracking-map/tracking-map';
import { DELIVERY_STATUS_LABEL, etaDate } from '../../models/delivery.model';
import { DeliveryService } from '../../services/delivery.service';

@Component({
  selector: 'app-delivery-list',
  standalone: true,
  imports: [DatePipe, RouterLink, TrackingMap],
  templateUrl: './delivery-list.html',
  styleUrl: './delivery-list.scss',
})
export class DeliveryList {
  private service = inject(DeliveryService);

  readonly rows = this.service.deliveries;
  readonly statusLabel = DELIVERY_STATUS_LABEL;
  readonly etaDate = etaDate;
  selectedId = signal<string | null>(null);

  readonly active = computed(
    () => this.rows().filter((d) => d.status !== 'delivered' && d.status !== 'failed').length,
  );

  // The map shows live shipments, plus whichever one is selected.
  readonly mapDeliveries = computed(() =>
    this.rows().filter(
      (d) => (d.status !== 'delivered' && d.status !== 'failed') || d.id === this.selectedId(),
    ),
  );
}
