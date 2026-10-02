import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { AssignDriverDialog } from '../../components/assign-driver-dialog/assign-driver-dialog';
import { OrderStatusSelect } from '../../components/order-status-select/order-status-select';
import {
  ORDER_STATUS_META,
  Order,
  PAYMENT_META,
  METHOD_LABEL,
  productSummary,
  qtySummary,
  subtotal,
} from '../../models/order.model';
import { OrderService } from '../../services/order.service';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-order-list',
  imports: [RouterLink, StatCard, CurrencyKshPipe, OrderStatusSelect, AssignDriverDialog],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderList {
  protected readonly service = inject(OrderService);
  protected readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly status = signal('');
  protected readonly page = signal(1);
  protected readonly toAssign = signal<Order | null>(null);

  protected readonly stats = this.service.stats;
  protected readonly meta = ORDER_STATUS_META;
  protected readonly pay = PAYMENT_META;
  protected readonly product = productSummary;
  protected readonly qty = qtySummary;
  protected readonly total = subtotal;

  protected readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    return this.service
      .orders()
      .filter(
        (o) =>
          (!this.status() || o.status === this.status()) &&
          (!q ||
            [o.code, o.buyer.name, o.farmer.name, ...o.items.map((i) => i.name)].some((v) =>
              v.toLowerCase().includes(q),
            )),
      )
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  });
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );
  protected readonly pages = computed(() =>
    Array.from({ length: this.pageCount() }, (_, i) => i + 1),
  );
  protected readonly rows = computed(() => {
    const start = (Math.min(this.page(), this.pageCount()) - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });
  protected readonly from = computed(() =>
    this.filtered().length ? (Math.min(this.page(), this.pageCount()) - 1) * PAGE_SIZE + 1 : 0,
  );

  protected setSearch(v: string) {
    this.search.set(v);
    this.page.set(1);
  }
  protected setStatus(v: string) {
    this.status.set(v);
    this.page.set(1);
  }
  protected compact(n: number) {
    return n >= 1e6
      ? 'KSh ' + (n / 1e6).toFixed(1) + 'M'
      : n >= 1e3
        ? 'KSh ' + Math.round(n / 1e3) + 'K'
        : 'KSh ' + n;
  }

  protected assign(agentId: string) {
    const o = this.toAssign();
    if (o) this.service.assignDriver(o.id, agentId);
    this.toAssign.set(null);
  }

  protected exportCsv() {
    const head = [
      'Order ID',
      'Buyer',
      'Farmer',
      'Product',
      'Qty',
      'Total (KSh)',
      'Status',
      'Payment',
      'Payment method',
      'Agent',
      'Placed',
    ];
    const body = this.filtered().map((o) => [
      o.code,
      o.buyer.name,
      o.farmer.name,
      productSummary(o),
      qtySummary(o),
      subtotal(o),
      ORDER_STATUS_META[o.status].label,
      PAYMENT_META[o.payment.status].label,
      o.payment.method ? METHOD_LABEL[o.payment.method] : '',
      o.delivery?.agentName ?? '',
      o.placedAt.replace('T', ' '),
    ]);
    const csv = [head, ...body]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(
      new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
