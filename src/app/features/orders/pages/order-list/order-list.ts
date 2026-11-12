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

const PAGE_SIZE = 10;

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

  // =========================================================
  // FILTERS
  // =========================================================

  protected readonly search = signal('');
  protected readonly status = signal<OrderStatusFilter>('ALL');

  // =========================================================
  // PAGINATION
  // =========================================================

  protected readonly page = signal(1);
  protected readonly currentPage = this.page;

  protected readonly toAssign = signal<Order | null>(null);

  // =========================================================
  // SERVICE SIGNALS
  // =========================================================

  protected readonly orders = this.service.orders;
  protected readonly loading = this.service.loading;
  protected readonly error = this.service.error;

  // Global statistics from GET /orders/admin/stats
  protected readonly stats = this.service.stats;
  protected readonly statsLoading = this.service.statsLoading;
  protected readonly statsError = this.service.statsError;

  protected readonly meta = ORDER_STATUS_META;

  // Pagination metadata from GET /orders
  protected readonly totalOrders = this.service.totalElements;
  protected readonly totalPages = this.service.totalPages;

  // =========================================================
  // FILTER ORDERS
  // =========================================================

  protected readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    const selectedStatus = this.status();

    return this.orders().filter((order) => {
      const matchesStatus =
        selectedStatus === 'ALL' || String(order.status ?? '').toUpperCase() === selectedStatus;

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
        String(order.pickupLocation ?? '')
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

  // Backend has already paginated the orders.
  protected readonly rows = computed(() => this.filtered());

  // =========================================================
  // PAGINATION DISPLAY
  // =========================================================

  protected readonly pageCount = computed(() => this.totalPages());

  protected readonly pages = computed(() =>
    Array.from({ length: this.pageCount() }, (_, index) => index + 1),
  );

  protected readonly from = computed(() => {
    if (this.filtered().length === 0) {
      return 0;
    }

    return (this.page() - 1) * PAGE_SIZE + 1;
  });

  protected readonly to = computed(() => {
    if (this.filtered().length === 0) {
      return 0;
    }

    return Math.min((this.page() - 1) * PAGE_SIZE + this.filtered().length, this.totalOrders());
  });

  // =========================================================
  // INITIALIZE PAGE
  // =========================================================

  ngOnInit(): void {
    // Fetch the first 10 orders for the table.
    this.loadOrders();

    // Fetch global statistics for all database orders.
    this.service.loadOrderStats();
  }

  // =========================================================
  // LOAD PAGINATED ORDERS
  // =========================================================

  protected loadOrders(): void {
    this.service.loadOrders(this.page() - 1, PAGE_SIZE);
  }

  // =========================================================
  // REFRESH
  // =========================================================

  protected refresh(): void {
    // Refresh table data.
    this.loadOrders();

    // Refresh global statistics.
    this.service.loadOrderStats();
  }

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  protected clearFilters(): void {
    this.search.set('');
    this.status.set('ALL');
    this.page.set(1);

    this.loadOrders();
  }

  // =========================================================
  // SEARCH
  // =========================================================

  protected setSearch(value: string): void {
    this.search.set(value);

    if (this.page() !== 1) {
      this.page.set(1);
      this.loadOrders();
    }
  }

  // =========================================================
  // STATUS FILTER
  // =========================================================

  protected setStatus(value: string): void {
    this.status.set(value as OrderStatusFilter);

    if (this.page() !== 1) {
      this.page.set(1);
      this.loadOrders();
    }
  }

  // =========================================================
  // PAGE NAVIGATION
  // =========================================================

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page() || this.loading()) {
      return;
    }

    this.page.set(page);
    this.loadOrders();

    // Do not reload global statistics here.
  }

  protected previousPage(): void {
    if (this.page() > 1 && !this.loading()) {
      this.goToPage(this.page() - 1);
    }
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages() && !this.loading()) {
      this.goToPage(this.page() + 1);
    }
  }

  // =========================================================
  // PRODUCT SUMMARY
  // =========================================================

  protected productSummary(order: Order): string {
    if (!order.items?.length) {
      return '-';
    }

    const firstProduct = order.items[0].productName ?? 'Product unavailable';

    if (order.items.length === 1) {
      return firstProduct;
    }

    return `${firstProduct} + ${order.items.length - 1} more`;
  }

  // =========================================================
  // QUANTITY
  // =========================================================

  protected qtySummary(order: Order): number {
    return (order.items ?? []).reduce((total, item) => total + Number(item.quantity || 0), 0);
  }

  // =========================================================
  // SUBTOTAL
  // =========================================================

  protected subtotal(order: Order): number {
    return Number(order.subtotal ?? order.total ?? 0);
  }

  // =========================================================
  // DATE FORMATTING
  // =========================================================

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

  // =========================================================
  // STATUS FORMATTING
  // =========================================================

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

      case 'in_transit':
        return 'status-shipped';

      case 'delivered':
      case 'completed':
        return 'status-delivered';

      case 'cancelled':
        return 'status-cancelled';

      default:
        return 'status-default';
    }
  }

  // =========================================================
  // PAYMENT FORMATTING
  // =========================================================

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

  // =========================================================
  // ASSIGN DRIVER
  // =========================================================

  protected assign(agentId: number): void {
    const order = this.toAssign();

    if (!order || !agentId) {
      return;
    }

    console.log('Assign driver', {
      orderId: order.id,
      agentId,
    });

    this.toAssign.set(null);
  }

  // =========================================================
  // EXPORT CSV
  // =========================================================

  protected exportCsv(): void {
    const headers = [
      'Order ID',
      'Buyer ID',
      'Products',
      'Qty',
      'Subtotal',
      'Delivery Fee',
      'Pickup Station',
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
      order.pickupLocation ?? '',
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
