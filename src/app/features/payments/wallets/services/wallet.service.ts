import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { API_BASE } from '../../../../core/config/api.config';
import { ApiResponse } from '../../../logistics/models/delivery.model';
import {
  AdminWalletOverview,
  Page,
  ReconciliationSummary,
  WalletApiError,
  WalletChartPoint,
} from '../models/wallet.model';
import { FinancialAccount } from '../models/finance-account.model';
import { SellerWallet } from '../models/seller-wallet.model';
import { LedgerEntry } from '../models/Ledger entry.model';
import { DateRange, WalletFilter, toQuery } from '../models/Wallet filter.model';
import { WalletTransaction } from '../models/wallet-transaction.model';

/**
 * BACKEND DEPENDENCY: these paths are the contract this screen expects. They are not in the
 * OpenAPI file shared so far. When the backend publishes its real paths, change them here only.
 */
export const WALLET_ENDPOINTS = {
  overview: `${API_BASE}/admin/wallet/overview`,
  accounts: `${API_BASE}/admin/wallet/accounts`,
  account: (id: string) => `${API_BASE}/admin/wallet/accounts/${encodeURIComponent(id)}`,
  transactions: `${API_BASE}/admin/wallet/transactions`,
  transaction: (id: string) => `${API_BASE}/admin/wallet/transactions/${encodeURIComponent(id)}`,
  ledger: `${API_BASE}/admin/wallet/ledger`,
  sellers: `${API_BASE}/admin/wallet/sellers`,
  seller: (id: string) => `${API_BASE}/admin/wallet/sellers/${encodeURIComponent(id)}`,
  charts: `${API_BASE}/admin/wallet/charts`,
  reconciliation: `${API_BASE}/admin/wallet/reconciliation-summary`,
  exportTransactions: `${API_BASE}/admin/wallet/transactions/export`,
  exportLedger: `${API_BASE}/admin/wallet/ledger/export`,
} as const;

@Injectable({ providedIn: 'root' })
export class AdminWalletService {
  private http = inject(HttpClient);

  overview(range: DateRange | null) {
    return this.get<AdminWalletOverview>(WALLET_ENDPOINTS.overview, rangeParams(range));
  }
  accounts() {
    return this.get<FinancialAccount[]>(WALLET_ENDPOINTS.accounts);
  }
  account(id: string) {
    return this.get<FinancialAccount>(WALLET_ENDPOINTS.account(id));
  }
  transactions(f: Partial<WalletFilter>) {
    return this.get<Page<WalletTransaction>>(WALLET_ENDPOINTS.transactions, toQuery(f));
  }
  transaction(id: string) {
    return this.get<WalletTransaction>(WALLET_ENDPOINTS.transaction(id));
  }
  ledger(f: Partial<WalletFilter>) {
    return this.get<Page<LedgerEntry>>(WALLET_ENDPOINTS.ledger, toQuery(f));
  }
  sellerWallets(f: Partial<WalletFilter>, sellerType = '') {
    return this.get<Page<SellerWallet>>(WALLET_ENDPOINTS.sellers, {
      ...toQuery(f),
      ...(sellerType ? { sellerType } : {}),
    });
  }
  sellerWallet(id: string) {
    return this.get<SellerWallet>(WALLET_ENDPOINTS.seller(id));
  }
  charts(range: DateRange | null) {
    return this.get<WalletChartPoint[]>(WALLET_ENDPOINTS.charts, rangeParams(range));
  }
  reconciliation() {
    return this.get<ReconciliationSummary>(WALLET_ENDPOINTS.reconciliation);
  }

  /** The server builds the file, so the export always matches the ledger. */
  async exportCsv(kind: 'transactions' | 'ledger', f: Partial<WalletFilter>): Promise<void> {
    const url =
      kind === 'transactions' ? WALLET_ENDPOINTS.exportTransactions : WALLET_ENDPOINTS.exportLedger;
    try {
      const { page: _p, size: _s, ...rest } = f;
      const blob = await firstValueFrom(
        this.http.get(url, { params: toQuery(rest), responseType: 'blob' }),
      );
      const a = document.createElement('a');
      const href = URL.createObjectURL(blob);
      a.href = href;
      a.download = `kilivana-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(href);
    } catch (e) {
      throw this.toError(e);
    }
  }

  private async get<T>(url: string, params: Record<string, string | number> = {}): Promise<T> {
    try {
      return await this.unwrap(this.http.get<ApiResponse<T>>(url, { params }));
    } catch (e) {
      throw this.toError(e);
    }
  }

  private async unwrap<T>(req: Observable<ApiResponse<T>>): Promise<T> {
    const res = await firstValueFrom(req);
    if (!res.success)
      throw new WalletApiError(res.error?.details || res.message || 'Request failed');
    return res.data;
  }

  private toError(e: unknown): WalletApiError {
    if (e instanceof WalletApiError) return e;
    if (e instanceof HttpErrorResponse) {
      const body = e.error as Partial<ApiResponse<unknown>> | null;
      if (e.status === 0)
        return new WalletApiError('Cannot reach the server. Check that the backend is running.');
      if (e.status === 401) return new WalletApiError('Your session expired. Sign in again.');
      if (e.status === 403)
        return new WalletApiError('You do not have permission to view financial data.');
      if ([404, 405, 501].includes(e.status)) {
        return new WalletApiError('The wallet service is not available on the backend yet.', true);
      }
      return new WalletApiError(
        body?.error?.details || body?.message || `Request failed (${e.status}).`,
      );
    }
    return new WalletApiError(e instanceof Error ? e.message : 'Something went wrong.');
  }
}

function rangeParams(r: DateRange | null): Record<string, string> {
  return r ? { from: r.from, to: r.to } : {};
}
