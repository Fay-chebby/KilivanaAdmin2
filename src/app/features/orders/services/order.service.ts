import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { ApiResponse, Order, OrderPage, OrderStatus } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);

  // =========================================================
  // BACKEND
  // =========================================================

  private readonly API_BASE_URL = 'https://either-juvenile-progeny.ngrok-free.dev/api/v1';

  private readonly ORDERS_URL = `${this.API_BASE_URL}/orders`;

  // =========================================================
  // STATE
  // =========================================================

  readonly orders = signal<Order[]>([]);

  readonly loading = signal(false);

  readonly error = signal<string | null>(null);

  readonly totalElements = signal(0);

  readonly totalPages = signal(0);

  readonly currentBackendPage = signal(0);

  // =========================================================
  // STATISTICS
  // =========================================================

  readonly stats = computed(() => {
    const orders = this.orders();

    return {
      totalOrders: this.totalElements(),

      placed: orders.filter((order) => order.status === 'placed').length,

      confirmed: orders.filter((order) => order.status === 'confirmed').length,

      processing: orders.filter((order) => order.status === 'processing').length,

      shipped: orders.filter((order) => order.status === 'shipped').length,

      delivered: orders.filter((order) => order.status === 'delivered').length,

      cancelled: orders.filter((order) => order.status === 'cancelled').length,

      paid: orders.filter((order) => order.paymentStatus === 'paid').length,

      pendingPayment: orders.filter((order) => order.paymentStatus === 'pending').length,

      revenue: orders.reduce((total, order) => total + Number(order.total || 0), 0),
    };
  });

  // =========================================================
  // GET ORDERS
  // =========================================================

  loadOrders(page: number = 0, size: number = 5): void {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('page', page).set('size', size);

    this.http
      .get<ApiResponse<OrderPage>>(this.ORDERS_URL, {
        params,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
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
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });
  }

  // =========================================================
  // GET ORDER TIMELINE
  // =========================================================

  getOrderTimeline(id: number) {
    return this.http.get<ApiResponse<unknown>>(`${this.ORDERS_URL}/${id}/timeline`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });
  }

  // =========================================================
  // UPDATE ORDER STATUS
  // =========================================================

  updateOrderStatus(id: number, status: OrderStatus) {
    return this.http.put<ApiResponse<Order>>(
      `${this.ORDERS_URL}/${id}/status`,
      { status },
      {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
    );
  }

  // =========================================================
  // POST ORDER STATUS
  // =========================================================
  //
  // Your Swagger shows BOTH:
  //
  // POST /api/v1/orders/{id}/status
  // PUT  /api/v1/orders/{id}/status
  //
  // Keep this method separate until we confirm the exact
  // request body expected by the POST endpoint.
  // =========================================================

  postOrderStatus(id: number, status: OrderStatus) {
    return this.http.post<ApiResponse<Order>>(
      `${this.ORDERS_URL}/${id}/status`,
      { status },
      {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
    );
  }

  // =========================================================
  // CANCEL ORDER
  // =========================================================

  cancelOrder(id: number, reason?: string) {
    const body = reason ? { reason } : {};

    return this.http.post<ApiResponse<Order>>(`${this.ORDERS_URL}/${id}/cancel`, body, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
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
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
    );
  }

  // =========================================================
  // DELETE ORDER
  // =========================================================

  deleteOrder(id: number) {
    return this.http.delete<ApiResponse<void>>(`${this.ORDERS_URL}/${id}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });
  }

  // =========================================================
  // REFRESH
  // =========================================================

  refresh(): void {
    this.loadOrders(this.currentBackendPage(), 5);
  }

  // =========================================================
  // CLEAR ERROR
  // =========================================================

  clearError(): void {
    this.error.set(null);
  }
}
