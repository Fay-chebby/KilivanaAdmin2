import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { ApiResponse, Order, OrderPage, OrderStatus, OrderStats } from '../models/order.model';

import { API_BASE } from '../../../core/config/api.config';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);

  // =========================================================
  // BACKEND
  // =========================================================

  private readonly ORDERS_URL = `${API_BASE}/orders`;

  private readonly headers = {
    'ngrok-skip-browser-warning': 'true',
  };

  // =========================================================
  // PAGINATION
  // =========================================================

  readonly pageSize = signal(10);

  readonly orders = signal<Order[]>([]);

  readonly loading = signal(false);

  readonly error = signal<string | null>(null);

  readonly totalElements = signal(0);

  readonly totalPages = signal(0);

  readonly currentBackendPage = signal(0);

  // =========================================================
  // GLOBAL ORDER STATISTICS
  // =========================================================

  readonly orderStats = signal<OrderStats>({
    totalOrders: 0,
    placed: 0,
    confirmed: 0,
    processing: 0,
    delivered: 0,
    cancelled: 0,
  });

  readonly stats = this.orderStats.asReadonly();

  readonly statsLoading = signal(false);

  readonly statsError = signal<string | null>(null);

  // =========================================================
  // GET GLOBAL ORDER STATISTICS
  // =========================================================

  loadOrderStats(): void {
    this.statsLoading.set(true);
    this.statsError.set(null);

    this.http
      .get<ApiResponse<OrderStats>>(`${this.ORDERS_URL}/admin/stats`, {
        headers: this.headers,
      })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.orderStats.set(response.data);
          } else {
            this.statsError.set(response.message || 'Failed to load order statistics.');
          }

          this.statsLoading.set(false);
        },

        error: (error) => {
          console.error('Failed to load global order statistics:', error);

          if (error?.status === 401 || error?.status === 403) {
            this.statsError.set('You are not authorized to view order statistics.');
          } else if (error?.status === 0) {
            this.statsError.set('Unable to connect to the Kilivana backend.');
          } else {
            this.statsError.set(error?.error?.message || 'Unable to load global order statistics.');
          }

          this.statsLoading.set(false);
        },
      });
  }

  // =========================================================
  // GET PAGINATED ORDERS
  // =========================================================

  loadOrders(page: number = 0, size: number = this.pageSize()): void {
    this.loading.set(true);
    this.error.set(null);

    this.pageSize.set(size);

    const params = new HttpParams().set('page', page).set('size', size);

    this.http
      .get<ApiResponse<OrderPage>>(this.ORDERS_URL, {
        params,
        headers: this.headers,
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.orders.set(response.data.content ?? []);
            this.totalElements.set(response.data.totalElements ?? 0);
            this.totalPages.set(response.data.totalPages ?? 0);
            this.currentBackendPage.set(response.data.number ?? page);
          } else {
            this.orders.set([]);
            this.totalElements.set(0);
            this.totalPages.set(0);

            this.error.set(response.message || 'Failed to load orders.');
          }

          this.loading.set(false);
        },

        error: (error) => {
          console.error('Failed to load orders:', error);

          this.orders.set([]);
          this.totalElements.set(0);
          this.totalPages.set(0);

          if (error?.status === 401) {
            this.error.set('Your session has expired or you are not authorized to view orders.');
          } else if (error?.status === 0) {
            this.error.set(
              'Unable to connect to the Kilivana backend. Check the ngrok tunnel and CORS configuration.',
            );
          } else {
            this.error.set(
              error?.error?.message || 'Unable to load orders from the Kilivana backend.',
            );
          }

          this.loading.set(false);
        },
      });
  }

  // =========================================================
  // GET SINGLE ORDER
  // =========================================================

  getOrderById(id: number) {
    return this.http.get<ApiResponse<Order>>(`${this.ORDERS_URL}/${id}`, {
      headers: this.headers,
    });
  }

  // =========================================================
  // GET ORDER TIMELINE
  // =========================================================

  getOrderTimeline(id: number) {
    return this.http.get<ApiResponse<unknown>>(`${this.ORDERS_URL}/${id}/timeline`, {
      headers: this.headers,
    });
  }

  // =========================================================
  // UPDATE ORDER STATUS
  // =========================================================

  updateOrderStatus(id: number, status: OrderStatus) {
    return this.http.put<ApiResponse<Order>>(`${this.ORDERS_URL}/${id}/status`, null, {
      params: new HttpParams().set('status', status),
      headers: this.headers,
    });
  }

  // =========================================================
  // POST ORDER STATUS
  // =========================================================

  postOrderStatus(id: number, status: OrderStatus) {
    return this.http.post<ApiResponse<Order>>(`${this.ORDERS_URL}/${id}/status`, null, {
      params: new HttpParams().set('status', status),
      headers: this.headers,
    });
  }

  // =========================================================
  // CANCEL ORDER
  // =========================================================

  cancelOrder(id: number, reason?: string) {
    const body = reason ? { reason } : {};

    return this.http.post<ApiResponse<Order>>(`${this.ORDERS_URL}/${id}/cancel`, body, {
      headers: this.headers,
    });
  }

  // =========================================================
  // CONFIRM RECEIPT
  // =========================================================

  confirmReceipt(id: number) {
    return this.http.post<ApiResponse<Order>>(
      `${this.ORDERS_URL}/${id}/confirm-receipt`,
      {},
      {
        headers: this.headers,
      },
    );
  }

  // =========================================================
  // DELETE ORDER
  // =========================================================

  deleteOrder(id: number) {
    return this.http.delete<ApiResponse<void>>(`${this.ORDERS_URL}/${id}`, {
      headers: this.headers,
    });
  }

  // =========================================================
  // ASSIGN DRIVER
  // =========================================================

  assignDriver(orderId: number, driverId: number) {
    const params = new HttpParams().set('driverId', driverId);

    return this.http.post<ApiResponse<Order>>(`${API_BASE}/admin/orders/${orderId}/assign`, null, {
      params,
      headers: this.headers,
    });
  }

  // =========================================================
  // REFRESH
  // =========================================================

  refresh(): void {
    this.loadOrders(this.currentBackendPage(), this.pageSize());

    this.loadOrderStats();
  }

  // =========================================================
  // CLEAR ERROR
  // =========================================================

  clearError(): void {
    this.error.set(null);
  }

  clearStatsError(): void {
    this.statsError.set(null);
  }
}
