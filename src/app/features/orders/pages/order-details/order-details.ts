import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { AssignDriverDialog } from '../../components/assign-driver-dialog/assign-driver-dialog';
import {
  ActionKind,
  ActionResult,
  OrderActionDialog,
} from '../../components/order-action-dialog/order-action-dialog';
import { OrderItemsTable } from '../../components/order-items-table/order-items-table';
import { OrderPipeline } from '../../components/order-pipeline/order-pipeline';
import { OrderTimeline } from '../../components/order-timeline/order-timeline';
import { METHOD_LABEL, ORDER_STATUS_META, PAYMENT_META, subtotal } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-details',
  imports: [
    RouterLink,
    CurrencyKshPipe,
    OrderPipeline,
    OrderItemsTable,
    OrderTimeline,
    AssignDriverDialog,
    OrderActionDialog,
  ],
  templateUrl: './order-details.html',
  styleUrl: './order-details.scss',
})
export class OrderDetails {
  private readonly service = inject(OrderService);
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly order = computed(() => this.service.getById(this.id));
  protected readonly meta = ORDER_STATUS_META;
  protected readonly pay = PAYMENT_META;
  protected readonly method = METHOD_LABEL;
  protected readonly total = subtotal;
  protected readonly modal = signal<ActionKind | null>(null);
  protected readonly showAssign = signal(false);

  protected readonly deliveryLabel = {
    assigned: 'Waiting for pickup',
    picked_up: 'On delivery',
    delivered: 'Delivered',
  } as const;
  protected readonly deliveryTone = {
    assigned: 'amber',
    picked_up: 'blue',
    delivered: 'green',
  } as const;

  protected confirmOrder() {
    this.service.confirm(this.id);
  }
  protected assign(agentId: string) {
    this.service.assignDriver(this.id, agentId);
    this.showAssign.set(false);
  }

  protected done(r: ActionResult) {
    switch (this.modal()) {
      case 'payment':
        this.service.recordPayment(this.id, r.method, r.reference);
        break;
      case 'cancel':
        this.service.cancel(this.id, r.reason);
        break;
      case 'dispute':
        this.service.dispute(this.id, r.reason);
        break;
      case 'resolve_buyer':
        this.service.resolveDispute(this.id, 'buyer', r.reason);
        break;
      case 'resolve_farmer':
        this.service.resolveDispute(this.id, 'farmer', r.reason);
        break;
      case 'release':
        this.service.complete(this.id);
        break;
    }
    this.modal.set(null);
  }
}
