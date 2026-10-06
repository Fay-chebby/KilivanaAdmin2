import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { Router, RouterLink } from '@angular/router';

import { StatCard } from '../../../../shared/components/stat-card/stat-card';
import { CurrencyKshPipe } from '../../../../shared/pipes/currency-kes-pipe';
import { AssignDriverDialog } from '../../components/assign-driver-dialog/assign-driver-dialog';
import { OrderStatusSelect } from '../../components/order-status-select/order-status-select';

import { ORDER_STATUS_META, Order, OrderStatus } from '../../models/order.model';

import { OrderService } from '../../services/order.service';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-order-list',

  imports: [RouterLink, StatCard, CurrencyKshPipe, OrderStatusSelect, AssignDriverDialog],

  templateUrl: './order-list.html',

  styleUrl: './order-list.scss',
})
export class OrderList implements OnInit {
  protected readonly service = inject(OrderService);

  protected readonly router = inject(Router);

  // ==============================
  // STATE
  // ==============================

  protected readonly search = signal('');

  protected readonly status = signal<OrderStatus>('placed');

  protected readonly page = signal(1);

  protected readonly toAssign = signal<Order | null>(null);

  // Backend orders
  protected readonly orders = this.service.orders;

  protected readonly loading = this.service.loading;

  protected readonly error = this.service.error;

  protected readonly stats = this.service.stats;

  protected readonly meta = ORDER_STATUS_META;

  // ==============================
  // FILTERING
  // ==============================

  protected readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();

    return this.orders().filter((order) => {
      const matchesStatus = !this.status() || order.status === this.status();

      const matchesSearch =
        !q ||
        order.code.toLowerCase().includes(q) ||
        String(order.id).includes(q) ||
        String(order.buyerId).includes(q) ||
        order.items.some((item) => item.productName.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  });

  // ==============================
  // PAGINATION
  // ==============================

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );

  protected readonly pages = computed(() =>
    Array.from(
      {
        length: this.pageCount(),
      },
      (_, i) => i + 1,
    ),
  );

  protected readonly rows = computed(() => {
    const currentPage = Math.min(this.page(), this.pageCount());

    const start = (currentPage - 1) * PAGE_SIZE;

    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  protected readonly from = computed(() => {
    if (!this.filtered().length) {
      return 0;
    }

    return (Math.min(this.page(), this.pageCount()) - 1) * PAGE_SIZE + 1;
  });

  protected readonly to = computed(() => Math.min(this.page() * PAGE_SIZE, this.filtered().length));

  // ==============================
  // INITIAL LOAD
  // ==============================

  ngOnInit(): void {
    this.loadOrders();
  }

  // ==============================
  // LOAD ORDERS
  // ==============================

  protected loadOrders(): void {
    // Backend uses 0-based pages
    const backendPage = this.page() - 1;

    this.service.loadOrders(backendPage, PAGE_SIZE);
  }

  // ==============================
  // SEARCH
  // ==============================

  protected setSearch(value: string): void {
    this.search.set(value);

    this.page.set(1);
  }

  // ==============================
  // STATUS FILTER
  // ==============================

  // ==============================
  // STATUS FILTER
  // ==============================

  protected setStatus(value: string): void {
    this.status.set(value as OrderStatus);

    this.page.set(1);
  }
  // ==============================
  // PAGINATION
  // ==============================

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

  // ==============================
  // REFRESH
  // ==============================

  protected refresh(): void {
    this.loadOrders();
  }

  // ==============================
  // ORDER HELPERS
  // ==============================

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
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  protected subtotal(order: Order): number {
    return Number(order.total || 0);
  }

  protected formatDate(date: string): string {
    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  // ==============================
  // STATUS
  // ==============================

  protected formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  protected getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
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

  protected formatPaymentStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  protected getPaymentStatusClass(status: string): string {
    switch (status.toLowerCase()) {
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

  // ==============================
  // ASSIGN DRIVER
  // ==============================

  protected assign(agentId: string): void {
    const order = this.toAssign();

    if (!order) {
      return;
    }

    // Driver assignment endpoint
    // will be connected once we use
    // the exact backend endpoint.

    console.log('Assign driver', {
      orderId: order.id,
      agentId,
    });

    this.toAssign.set(null);
  }

  // ==============================
  // EXPORT CSV
  // ==============================

  protected exportCsv(): void {
    const head = [
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

      order.subtotal,

      order.deliveryFee,

      order.total,

      this.formatStatus(order.status),

      this.formatPaymentStatus(order.paymentStatus),

      order.addressId,

      this.formatDate(order.createdAt),

      this.formatDate(order.updatedAt),
    ]);

    const csv = [head, ...body]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const url = URL.createObjectURL(
      new Blob(['\ufeff' + csv], {
        type: 'text/csv;charset=utf-8;',
      }),
    );

    const a = document.createElement('a');

    a.href = url;

    a.download = 'kilivana-orders.csv';

    a.click();

    URL.revokeObjectURL(url);
  }
}
