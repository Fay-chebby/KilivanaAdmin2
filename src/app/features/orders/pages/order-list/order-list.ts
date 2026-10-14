import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { AssignDriverDialog } from '../../components/assign-driver-dialog/assign-driver-dialog';
import {
  OrderStatusSelect,
  OrderStatusFilter,
} from '../../components/order-status-select/order-status-select';

import { ORDER_STATUS_META, Order } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [RouterLink, StatCard, CurrencyKshPipe, OrderStatusSelect, AssignDriverDialog],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderList implements OnInit {
  protected readonly service = inject(OrderService);
  protected readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly status = signal<OrderStatusFilter>('ALL');

  protected readonly page = signal(1);
  protected readonly toAssign = signal<Order | null>(null);

  protected readonly orders = this.service.orders;
  protected readonly loading = this.service.loading;
  protected readonly error = this.service.error;
  protected readonly stats = this.service.stats;
  protected readonly meta = ORDER_STATUS_META;

  protected readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    const selectedStatus = this.status();

    return this.orders().filter((order) => {
      const matchesStatus = selectedStatus === 'ALL' || order.status === selectedStatus;

      const matchesSearch =
        !query ||
        String(order.code ?? '')
          .toLowerCase()
          .includes(query) ||
        String(order.id ?? '')
          .toLowerCase()
          .includes(query) ||
        String(order.buyerId ?? '')
          .toLowerCase()
          .includes(query) ||
        (order.items ?? []).some((item) =>
          String(item.productName ?? '')
            .toLowerCase()
            .includes(query),
        );

      return matchesStatus && matchesSearch;
    });
  });
  protected clearFilters(): void {
    this.search.set('');
    this.status.set('ALL');
    this.page.set(1);
  }

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );

  protected readonly pages = computed(() =>
    Array.from({ length: this.pageCount() }, (_, index) => index + 1),
  );

  protected readonly rows = computed(() => {
    const currentPage = Math.min(this.page(), this.pageCount());
    const start = (currentPage - 1) * PAGE_SIZE;

    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  protected readonly from = computed(() => {
    const total = this.filtered().length;

    if (total === 0) {
      return 0;
    }

    return (Math.min(this.page(), this.pageCount()) - 1) * PAGE_SIZE + 1;
  });

  protected readonly to = computed(() => Math.min(this.page() * PAGE_SIZE, this.filtered().length));

  ngOnInit(): void {
    this.loadOrders();
  }

  protected loadOrders(): void {
    this.service.loadOrders(this.page() - 1, PAGE_SIZE);
  }

  protected refresh(): void {
    this.loadOrders();
  }

  protected setSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  protected setStatus(value: string): void {
    this.status.set(value as OrderStatusFilter);
    this.page.set(1);
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.pageCount()) {
      return;
    }

    this.page.set(page);
    this.loadOrders();
  }

  protected previousPage(): void {
    if (this.page() > 1) {
      this.page.update((current) => current - 1);
      this.loadOrders();
    }
  }

  protected nextPage(): void {
    if (this.page() < this.pageCount()) {
      this.page.update((current) => current + 1);
      this.loadOrders();
    }
  }

  protected productSummary(order: Order): string {
    if (!order.items?.length) {
      return '-';
    }

    if (order.items.length === 1) {
      return order.items[0].productName;
    }

    return `${order.items[0].productName} + ${order.items.length - 1} more`;
  }

  protected qtySummary(order: Order): number {
    return (order.items ?? []).reduce((total, item) => total + Number(item.quantity || 0), 0);
  }

  protected subtotal(order: Order): number {
    return Number(order.subtotal ?? order.total ?? 0);
  }

  protected formatDate(date: string | null | undefined): string {
    if (!date) {
      return '-';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '-';
    }

    return parsedDate.toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  protected formatStatus(status: string | null | undefined): string {
    return (status ?? '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  protected getStatusClass(status: string | null | undefined): string {
    switch ((status ?? '').toLowerCase()) {
      case 'placed':
        return 'status-placed';
      case 'confirmed':
        return 'status-confirmed';
      case 'processing':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  protected formatPaymentStatus(status: string | null | undefined): string {
    return (status ?? '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  protected getPaymentStatusClass(status: string | null | undefined): string {
    switch ((status ?? '').toLowerCase()) {
      case 'paid':
        return 'payment-paid';
      case 'pending':
        return 'payment-pending';
      case 'failed':
        return 'payment-failed';
      case 'refunded':
        return 'payment-refunded';
      default:
        return 'payment-default';
    }
  }

  protected assign(agentId: number): void {
    const order = this.toAssign();

    if (!order || !agentId) {
      return;
    }

    // TODO: Replace with the actual backend driver-assignment API.
    console.log('Assign driver', {
      orderId: order.id,
      agentId,
    });

    this.toAssign.set(null);
  }

  protected exportCsv(): void {
    const headers = [
      'Order ID',
      'Buyer ID',
      'Products',
      'Qty',
      'Subtotal',
      'Delivery Fee',
      'Total (KSh)',
      'Status',
      'Payment',
      'Address ID',
      'Placed',
      'Updated',
    ];

    const body = this.filtered().map((order) => [
      order.code,
      order.buyerId,
      this.productSummary(order),
      this.qtySummary(order),
      this.subtotal(order),
      order.deliveryFee,
      order.total,
      this.formatStatus(order.status),
      this.formatPaymentStatus(order.paymentStatus),
      order.addressId,
      this.formatDate(order.createdAt),
      this.formatDate(order.updatedAt),
    ]);

    const csv = [headers, ...body]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'kilivana-orders.csv';

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }
}
