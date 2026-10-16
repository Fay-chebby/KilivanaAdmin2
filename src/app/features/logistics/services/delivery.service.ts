import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

import { Observable, firstValueFrom } from 'rxjs';

import {
  ActionResult,
  AdminDriver,
  ApiResponse,
  Delivery,
  DriverLocation,
  LogisticsJob,
  OrderLite,
  ProofOfDeliveryDto,
  TrackingEvent,
  toDelivery,
} from '../models/delivery.model';

// ---------- API configuration ----------
const API_BASE = 'https://either-juvenile-progeny.ngrok-free.dev/api/v1';

const API_HEADERS = new HttpHeaders({
  'ngrok-skip-browser-warning': 'true',
});

const ACTIVE = new Set([
  'accepted',
  'en_route_to_pickup',
  'arrived_at_pickup',
  'picked_up',
  'in_transit',
  'arrived_at_destination',
]);

const POLL_MS = 10_000;

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  private readonly http = inject(HttpClient);

  // ---------- State ----------
  private readonly _deliveries = signal<Delivery[]>([]);
  private readonly _drivers = signal<AdminDriver[]>([]);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly deliveries = this._deliveries.asReadonly();
  readonly drivers = this._drivers.asReadonly();

  readonly availableDrivers = computed(() =>
    this._drivers().filter((d) => d.status !== 'suspended' && d.status !== 'offline'),
  );

  readonly stats = computed(() => {
    const list = this._deliveries();

    const count = (status: Delivery['status']) => list.filter((d) => d.status === status).length;

    return {
      pending: count('pending'),
      assigned: count('assigned'),
      in_transit: count('in_transit'),
      arrived: count('arrived'),
      delivered: count('delivered'),
      failed: count('failed'),
    };
  });

  // ---------- Local lookups ----------
  get(id: string) {
    return this._deliveries().find((d) => d.id === id);
  }

  getByOrderId(orderId: string) {
    return this._deliveries().find((d) => d.orderId === orderId);
  }

  // ---------- Loading ----------
  /** Admin: load all jobs, drivers, orders, tracking events and GPS locations. */
  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const [jobs, drivers] = await Promise.all([
        this.unwrap<LogisticsJob[]>(
          this.http.get<ApiResponse<LogisticsJob[]>>(`${API_BASE}/admin/logistics/jobs`, {
            headers: API_HEADERS,
          }),
        ),

        this.unwrap<AdminDriver[]>(
          this.http.get<ApiResponse<AdminDriver[]>>(`${API_BASE}/admin/drivers`, {
            headers: API_HEADERS,
          }),
        ).catch(() => [] as AdminDriver[]),
      ]);

      this._drivers.set(drivers);
      await this.hydrate(jobs ?? []);
    } catch (e) {
      this.error.set(this.msg(e));
    } finally {
      this.loading.set(false);
    }
  }

  /** Load one job for its details or tracking page. */
  async loadOne(jobId: string): Promise<void> {
    this.error.set(null);

    try {
      if (!this._drivers().length) {
        this._drivers.set(
          await this.unwrap<AdminDriver[]>(
            this.http.get<ApiResponse<AdminDriver[]>>(`${API_BASE}/admin/drivers`, {
              headers: API_HEADERS,
            }),
          ).catch(() => [] as AdminDriver[]),
        );
      }

      const job = await this.unwrap<LogisticsJob>(
        this.http.get<ApiResponse<LogisticsJob>>(`${API_BASE}/logistics/jobs/${jobId}`, {
          headers: API_HEADERS,
        }),
      );

      await this.hydrate([job], true);
    } catch (e) {
      this.error.set(this.msg(e));
    }
  }

  /** Load the logistics job associated with a buyer's order. */
  async loadForOrder(orderId: string): Promise<void> {
    this.error.set(null);

    try {
      const jobs = await this.unwrap<LogisticsJob[]>(
        this.http.get<ApiResponse<LogisticsJob[]>>(`${API_BASE}/logistics/jobs/order/${orderId}`, {
          headers: API_HEADERS,
        }),
      );

      const latest = [...(jobs ?? [])].sort((a, b) => b.id - a.id)[0];

      if (latest) {
        await this.hydrate([latest], true);
      }
    } catch (e) {
      this.error.set(this.msg(e));
    }
  }

  // ---------- Live tracking ----------
  /** Refresh live jobs every 10 seconds until the page is destroyed. */
  watchLive(destroyRef: DestroyRef): void {
    const timer = setInterval(() => void this.refreshLive(), POLL_MS);

    destroyRef.onDestroy(() => clearInterval(timer));
  }

  private async refreshLive(): Promise<void> {
    const live = this._deliveries().filter((d) => ACTIVE.has(d.rawStatus));

    if (!live.length) return;

    const results = await Promise.all(
      live.map(async (d) => {
        const [job, fix] = await Promise.all([
          this.unwrap<LogisticsJob>(
            this.http.get<ApiResponse<LogisticsJob>>(`${API_BASE}/logistics/jobs/${d.jobId}`, {
              headers: API_HEADERS,
            }),
          ).catch(() => null),

          this.fix(d.jobId),
        ]);

        return { id: d.id, job, fix };
      }),
    );

    this._deliveries.update((list) =>
      list.map((d) => {
        const result = results.find((r) => r.id === d.id);

        if (!result?.job) return d;

        const next = toDelivery(
          result.job,
          undefined,
          this.driverOf(result.job.driverId),
          [],
          result.fix,
        );

        // Preserve enriched fields that are not fetched during polling.
        return {
          ...next,
          buyerName: d.buyerName,
          buyerPhone: d.buyerPhone,
          deliveryAddress: d.deliveryAddress,
          farmName: d.farmName,
          orderCode: d.orderCode,
          events: d.events,
          proof: d.proof ?? next.proof,
        };
      }),
    );
  }

  // ---------- Admin actions ----------
  assign(jobId: string, driverId: number): Promise<ActionResult> {
    return this.act(
      jobId,
      this.http.put<ApiResponse<LogisticsJob>>(`${API_BASE}/logistics/jobs/${jobId}/assign`, null, {
        headers: API_HEADERS,
        params: { driverId },
      }),
      'Driver assigned.',
    );
  }

  cancel(jobId: string, reason: string): Promise<ActionResult> {
    if (!reason.trim()) {
      return Promise.resolve({
        ok: false,
        message: 'Write the reason for cancelling.',
      });
    }

    return this.act(
      jobId,
      this.http.put<ApiResponse<LogisticsJob>>(
        `${API_BASE}/logistics/jobs/${jobId}/cancel`,
        reason.trim(),
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          }),
        },
      ),
      'Delivery cancelled.',
    );
  }

  /** Confirm pickup by updating the backend job status. */
  confirmPickup(jobId: string): Promise<ActionResult> {
    return this.act(
      jobId,
      this.http.put<ApiResponse<LogisticsJob>>(`${API_BASE}/logistics/jobs/${jobId}/status`, null, {
        headers: API_HEADERS,
        params: { status: 'picked_up' },
      }),
      'Pickup confirmed. The order is now in transit.',
    );
  }

  /** Confirm delivery using the buyer's six-digit OTP. */
  async confirmDelivery(jobId: string, otp: string, recipientName: string): Promise<ActionResult> {
    if (!/^\d{6}$/.test(otp.trim())) {
      return {
        ok: false,
        message: 'Enter the 6-digit code.',
      };
    }

    try {
      await this.unwrap(
        this.http.post<ApiResponse<ProofOfDeliveryDto>>(
          `${API_BASE}/logistics/jobs/${jobId}/proof-of-delivery`,
          {
            logisticsJobId: Number(jobId),
            recipientName: recipientName.trim() || undefined,
          },
          {
            headers: API_HEADERS,
            params: { otp: otp.trim() },
          },
        ),
      );

      // Some backends close the job when proof is submitted.
      // If not, update the status to delivered.
      const job = await this.unwrap<LogisticsJob>(
        this.http.get<ApiResponse<LogisticsJob>>(`${API_BASE}/logistics/jobs/${jobId}`, {
          headers: API_HEADERS,
        }),
      );

      if (job.status !== 'delivered') {
        await this.unwrap(
          this.http.put<ApiResponse<LogisticsJob>>(
            `${API_BASE}/logistics/jobs/${jobId}/status`,
            null,
            {
              headers: API_HEADERS,
              params: { status: 'delivered' },
            },
          ),
        );
      }

      await this.loadOne(jobId);

      return {
        ok: true,
        message: 'Delivery confirmed. The order is now delivered.',
      };
    } catch (e) {
      await this.loadOne(jobId);

      return {
        ok: false,
        message: this.msg(e),
      };
    }
  }

  // ---------- Internal helpers ----------
  private driverOf(id?: number | null) {
    return id == null ? undefined : this._drivers().find((d) => d.userId === id);
  }

  /** Enrich logistics jobs with order, driver, event and location data. */
  private async hydrate(jobs: LogisticsJob[], full = false): Promise<void> {
    const orderIds = [...new Set(jobs.map((j) => j.orderId))];
    const orders = new Map<number, OrderLite>();

    await Promise.all(
      orderIds.map(async (id) => {
        const order = await this.unwrap<OrderLite>(
          this.http.get<ApiResponse<OrderLite>>(`${API_BASE}/orders/${id}`, {
            headers: API_HEADERS,
          }),
        ).catch(() => null);

        if (order) {
          orders.set(id, order);
        }
      }),
    );

    const rows = await Promise.all(
      jobs.map(async (job) => {
        const live = ACTIVE.has(job.status);

        const wantEvents = full || live || job.status === 'delivered';

        const [events, fix, pod] = await Promise.all([
          wantEvents
            ? this.unwrap<TrackingEvent[]>(
                this.http.get<ApiResponse<TrackingEvent[]>>(
                  `${API_BASE}/logistics/tracking-events/job/${job.id}`,
                  { headers: API_HEADERS },
                ),
              ).catch(() => [] as TrackingEvent[])
            : Promise.resolve([] as TrackingEvent[]),

          live ? this.fix(job.id) : Promise.resolve(null),

          job.status === 'delivered'
            ? this.unwrap<ProofOfDeliveryDto>(
                this.http.get<ApiResponse<ProofOfDeliveryDto>>(
                  `${API_BASE}/logistics/proof-of-delivery/job/${job.id}`,
                  { headers: API_HEADERS },
                ),
              ).catch(() => null)
            : Promise.resolve(null),
        ]);

        return toDelivery(
          job,
          orders.get(job.orderId),
          this.driverOf(job.driverId),
          events,
          fix,
          pod,
        );
      }),
    );

    this._deliveries.update((previous) => {
      const byId = new Map(previous.map((d) => [d.id, d]));

      for (const row of rows) {
        byId.set(row.id, row);
      }

      return full ? [...byId.values()] : rows.sort((a, b) => b.jobId - a.jobId);
    });
  }

  /** Get the latest GPS location; 404 is possible before movement starts. */
  private fix(jobId: number): Promise<DriverLocation | null> {
    return this.unwrap<DriverLocation>(
      this.http.get<ApiResponse<DriverLocation>>(`${API_BASE}/tracking/${jobId}/location`, {
        headers: API_HEADERS,
      }),
    ).catch(() => null);
  }

  /** Execute an action, then reload its job. */
  private async act(
    jobId: string,
    request: Observable<ApiResponse<LogisticsJob>>,
    successMessage: string,
  ): Promise<ActionResult> {
    try {
      await this.unwrap(request);
      await this.loadOne(jobId);

      return {
        ok: true,
        message: successMessage,
      };
    } catch (e) {
      return {
        ok: false,
        message: this.msg(e),
      };
    }
  }

  /** Extract the data from the standard API response envelope. */
  private async unwrap<T>(request: Observable<ApiResponse<T>>): Promise<T> {
    const response = await firstValueFrom(request);

    if (!response.success) {
      throw new Error(response.error?.details || response.message || 'Request failed');
    }

    return response.data;
  }

  /** Convert backend errors into readable messages. */
  private msg(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const body = e.error as Partial<ApiResponse<unknown>> | null;

      if (e.status === 0) {
        return 'Cannot reach the server. Check that the backend is running.';
      }

      if (e.status === 401 || e.status === 403) {
        return 'You are not allowed to do this. Sign in again.';
      }

      if (e.status === 429) {
        return 'Too many wrong codes. The code is locked for a while.';
      }

      return body?.error?.details || body?.message || `Request failed (${e.status}).`;
    }

    return e instanceof Error ? e.message : 'Something went wrong.';
  }
}
