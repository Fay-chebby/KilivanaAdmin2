import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { API_BASE } from '../../../core/config/api.config';
import { ApiResponse } from '../../logistics/models/delivery.model';

import {
  MonthlyPoint,
  PLATFORM_FEE_RATE,
  PayResult,
  PaymentResponse,
  TXN_TYPE_LABEL,
  Transaction,
  canRefund,
  canSettle,
  kes,
} from '../models/payment.model';

interface OrderLite {
  id: number;
  code?: string;
  buyerName?: string;
  sellerName?: string;
}

const METHOD: Record<PaymentResponse['method'], Transaction['method']> = {
  mpesa: 'M-Pesa',
  bank: 'Bank transfer',
  card: 'Card',
};

const RECEIVED = new Set(['paid', 'held', 'settled']);
const MONTHS = 7;

/**
 * The backend has one record per order payment.
 * The admin screens show three kinds of row, so each payment is expanded:
 * - Buyer payment
 * - Farmer payout (once the money is received)
 * - Refund (once the payment is refunded)
 */
export function toTransactions(p: PaymentResponse, order?: OrderLite): Transaction[] {
  const ref = order?.code ?? `ORD-${p.orderId}`;
  const buyer = order?.buyerName ?? `Buyer (order ${p.orderId})`;
  const seller = order?.sellerName ?? `Seller (order ${p.orderId})`;

  const fee = Math.round(p.amount * PLATFORM_FEE_RATE);
  const at = p.paidAt ?? p.createdAt;

  const base = {
    paymentId: p.id,
    rawStatus: p.status,
    reference: ref,
    method: METHOD[p.method] ?? 'M-Pesa',
  };

  const pay: Transaction = {
    ...base,
    id: `PAY-${p.id}`,
    type: 'payment',
    party: buyer,
    amount: p.amount,
    fee,
    net: p.amount - fee,
    status: p.status === 'pending' ? 'pending' : p.status === 'failed' ? 'failed' : 'settled',
    createdAt: p.createdAt,
    settledAt: p.paidAt,
    externalRef: p.reference || undefined,
  };

  const out: Transaction[] = [pay];

  if (RECEIVED.has(p.status)) {
    const payout = p.amount - fee;

    out.push({
      ...base,
      id: `PAY-${p.id}-PO`,
      type: 'payout',
      party: seller,
      amount: payout,
      fee: 0,
      net: payout,
      status: p.status === 'settled' ? 'settled' : 'pending',
      createdAt: at,
      settledAt: p.status === 'settled' ? p.updatedAt : undefined,
    });
  }

  if (p.status === 'refunded') {
    out.push({
      ...base,
      id: `PAY-${p.id}-RF`,
      type: 'refund',
      party: buyer,
      amount: p.amount,
      fee: 0,
      net: -p.amount,
      status: 'settled',
      createdAt: p.updatedAt ?? at,
      settledAt: p.updatedAt,
    });
  }

  return out;
}

export function buildMonthly(payments: PaymentResponse[], now = new Date()): MonthlyPoint[] {
  const points: MonthlyPoint[] = [];

  for (let i = MONTHS - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

    const gross = payments
      .filter((p) => RECEIVED.has(p.status))
      .filter((p) => {
        const t = new Date(p.paidAt ?? p.createdAt);

        return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth();
      })
      .reduce((s, p) => s + p.amount, 0);

    points.push({
      label: d.toLocaleString('en-US', { month: 'short' }),
      longLabel: d.toLocaleString('en-US', { month: 'long' }),
      gross,
      revenue: Math.round(gross * PLATFORM_FEE_RATE),
    });
  }

  return points;
}

const pct = (cur: number, prev: number) =>
  prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : 0;

const sum = (list: Transaction[]) => list.reduce((s, t) => s + t.amount, 0);

const fail = (message: string): PayResult => ({
  ok: false,
  message,
});

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly http = inject(HttpClient);

  /**
   * Ngrok warning-bypass header.
   * Reuse it for every request made by this service.
   */
  private readonly headers = new HttpHeaders({
    'ngrok-skip-browser-warning': 'true',
  });

  private orders = new Map<number, OrderLite>();

  private _payments = signal<PaymentResponse[]>([]);
  private _txns = signal<Transaction[]>([]);
  private _monthly = signal<MonthlyPoint[]>(buildMonthly([]));

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly transactions = this._txns.asReadonly();
  readonly monthlySeries = this._monthly.asReadonly();

  readonly stats = computed(() => {
    const m = this._monthly();
    const cur = m[m.length - 1];
    const prev = m[m.length - 2];

    const payouts = this._txns().filter((t) => t.type === 'payout' && t.status === 'pending');

    const refunds = this._txns().filter((t) => t.type === 'refund' && t.status === 'pending');

    return {
      monthLabel: cur.label,
      revenue: cur.revenue,
      revenueDelta: pct(cur.revenue, prev.revenue),
      gross: cur.gross,
      grossDelta: pct(cur.gross, prev.gross),
      pendingPayouts: sum(payouts),
      pendingPayoutCount: payouts.length,
      openRefunds: sum(refunds),
      openRefundCount: refunds.length,
    };
  });

  get(id: string) {
    return this._txns().find((t) => t.id === id);
  }

  // ---------- Loading ----------

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const list = await this.unwrap(
        this.http.get<ApiResponse<PaymentResponse[]>>(`${API_BASE}/admin/payments`, {
          headers: this.headers,
        }),
      );

      await this.rebuild(list ?? []);
    } catch (e) {
      this.error.set(this.msg(e));
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Details page opened directly:
   * make sure the payment data is loaded.
   */
  async ensureLoaded(): Promise<void> {
    if (!this._payments().length) {
      await this.load();
    }
  }

  // ---------- Actions ----------

  /**
   * Settle a payout.
   * Payments settle automatically; refunds are created by refund().
   */
  async settle(id: string): Promise<PayResult> {
    const t = this.get(id);

    if (!t) {
      return fail('Transaction not found.');
    }

    if (t.status === 'settled') {
      return fail(`${t.id} is already settled.`);
    }

    if (!canSettle(t)) {
      return fail('Payments settle automatically.');
    }

    try {
      await this.unwrap(
        this.http.put<ApiResponse<PaymentResponse>>(
          `${API_BASE}/payments/${t.paymentId}/status`,
          null,
          {
            params: { status: 'settled' },
            headers: this.headers,
          },
        ),
      );

      await this.load();

      return {
        ok: true,
        message: `${TXN_TYPE_LABEL[t.type]} of ${kes(t.amount)} to ${t.party} was settled.`,
      };
    } catch (e) {
      return fail(this.msg(e));
    }
  }

  /**
   * Refund the buyer for a received payment.
   */
  async refund(id: string): Promise<PayResult> {
    const t = this.get(id);

    if (!t || !canRefund(t)) {
      return fail('This payment cannot be refunded.');
    }

    try {
      await this.unwrap(
        this.http.post<ApiResponse<PaymentResponse>>(
          `${API_BASE}/payments/${t.paymentId}/refund`,
          null,
          { headers: this.headers },
        ),
      );

      await this.load();

      return {
        ok: true,
        message: `Refunded ${kes(t.amount)} to ${t.party}.`,
      };
    } catch (e) {
      return fail(this.msg(e));
    }
  }

  /**
   * Settle every pending payout, one request each.
   */
  async runPayoutBatch(): Promise<PayResult> {
    const pending = this._txns().filter((t) => t.type === 'payout' && t.status === 'pending');

    if (!pending.length) {
      return fail('There are no pending payouts to run.');
    }

    const results = await Promise.allSettled(
      pending.map((t) =>
        this.unwrap(
          this.http.put<ApiResponse<PaymentResponse>>(
            `${API_BASE}/payments/${t.paymentId}/status`,
            null,
            {
              params: { status: 'settled' },
              headers: this.headers,
            },
          ),
        ),
      ),
    );

    await this.load();

    const done = pending.filter((_, i) => results[i].status === 'fulfilled');

    const failed = pending.length - done.length;

    if (!done.length) {
      return fail('No payouts could be settled. Try again.');
    }

    return {
      ok: failed === 0,
      message: `Paid ${done.length} payout${done.length === 1 ? '' : 's'} totalling ${kes(sum(done))}.${failed ? ` ${failed} failed and are still pending.` : ''}`,
    };
  }

  // ---------- Internals ----------

  private async rebuild(list: PaymentResponse[]): Promise<void> {
    const ids = [...new Set(list.map((p) => p.orderId))].filter((id) => !this.orders.has(id));

    await Promise.all(
      ids.map(async (id) => {
        const order = await this.unwrap(
          this.http.get<ApiResponse<OrderLite>>(`${API_BASE}/orders/${id}`, {
            headers: this.headers,
          }),
        ).catch(() => null);

        if (order) {
          this.orders.set(id, order);
        }
      }),
    );

    const sorted = [...list].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    this._payments.set(sorted);

    this._txns.set(sorted.flatMap((p) => toTransactions(p, this.orders.get(p.orderId))));

    this._monthly.set(buildMonthly(sorted));
  }

  private async unwrap<T>(req: Observable<ApiResponse<T>>): Promise<T> {
    const res = await firstValueFrom(req);

    if (!res.success) {
      throw new Error(res.error?.details || res.message || 'Request failed');
    }

    return res.data;
  }

  private msg(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const b = e.error as Partial<ApiResponse<unknown>> | null;

      if (e.status === 0) {
        return 'Cannot reach the server. Check that the backend is running.';
      }

      if (e.status === 401 || e.status === 403) {
        return 'You are not allowed to do this. Sign in again.';
      }

      return b?.error?.details || b?.message || `Request failed (${e.status}).`;
    }

    return e instanceof Error ? e.message : 'Something went wrong.';
  }
}
