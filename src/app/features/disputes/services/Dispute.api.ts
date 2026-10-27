import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';
import {
  ApiEnvelope,
  DisputeDto,
  NotificationRequestDto,
  OrderLiteDto,
  PageDto,
  ResolutionRequestDto,
} from '../models/Dispute api.model';

type Params = Record<string, string | number | boolean>;

@Injectable({ providedIn: 'root' })
export class DisputeApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}`;

  private readonly headers = new HttpHeaders({
    'ngrok-skip-browser-warning': 'true',
  });

  private async call<T>(method: string, path: string, body?: unknown, params?: Params): Promise<T> {
    const res = await firstValueFrom(
      this.http.request<ApiEnvelope<T>>(method, this.base + path, {
        body,
        params,
        headers: this.headers,
      }),
    );

    if (res && res.success === false) {
      throw { error: { message: res.message } };
    }

    return res.data;
  }

  private async listOrders(): Promise<OrderLiteDto[]> {
    const items: OrderLiteDto[] = [];

    for (let page = 0; page < 100; page++) {
      const res = await this.call<PageDto<OrderLiteDto>>('GET', '/admin/orders', undefined, {
        page,
        size: 200,
      });

      items.push(...(res?.content ?? []));

      if (!res || res.last || !res.content?.length) break;
    }

    return items;
  }

  private async disputesOfOrder(orderId: number): Promise<DisputeDto[]> {
    try {
      return (await this.call<DisputeDto[]>('GET', `/disputes/order/${orderId}`)) ?? [];
    } catch (e) {
      if ((e as { status?: number }).status === 404) return [];
      throw e;
    }
  }

  /**
   * The backend has no "list every dispute" route yet, so this reads the orders
   * and asks each one for its disputes (eight at a time).
   * When GET /admin/disputes exists, replace this one method.
   */
  async listDisputes(): Promise<{
    disputes: DisputeDto[];
    orders: OrderLiteDto[];
  }> {
    const orders = await this.listOrders();
    const found = new Map<number, DisputeDto>();

    let next = 0;
    let failed = 0;
    let firstError: unknown = null;

    const worker = async () => {
      while (next < orders.length) {
        const o = orders[next++];

        try {
          for (const d of await this.disputesOfOrder(o.id)) {
            found.set(d.id, d);
          }
        } catch (e) {
          failed++;
          firstError ??= e;
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(8, orders.length) }, worker));

    if (orders.length && failed === orders.length) {
      throw firstError;
    }

    return { disputes: [...found.values()], orders };
  }

  setStatus(id: number, status: 'open' | 'in_progress' | 'resolved' | 'closed') {
    return this.call<DisputeDto>('PUT', `/disputes/${id}/status`, undefined, { status });
  }

  resolve(id: number, req: ResolutionRequestDto) {
    return this.call<DisputeDto>('PUT', `/disputes/${id}/resolution`, req);
  }

  /** One-way message to a buyer or farmer, shown in their in-app notifications */
  notify(req: NotificationRequestDto) {
    return this.call<unknown>('POST', '/admin/notifications', req);
  }
}
