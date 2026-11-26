import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChartPoint, RevenueChart } from '../../../components/revenue-chart/revenue-chart';
import { FinancialAccountCards } from '../../components/financial-account-cards/financial-account-cards';
import { WalletBalanceBreakdown } from '../../components/wallet-balance-breakdown/wallet-balance-breakdown';
import { WalletError } from '../../components/wallet-error/wallet-error';
import { WalletExportDialog } from '../../components/wallet-export-dialog/wallet-export-dialog';
import { WalletOverviewCards } from '../../components/wallet-overview-cards/wallet-overview-cards';
import {
  AdminWalletOverview,
  CHART_SERIES,
  ChartSeries,
  ReconciliationSummary,
  WalletApiError,
  WalletChartPoint,
  fmtDateTime,
  kesExact,
} from '../../models/wallet.model';
import { FinancialAccount } from '../../models/finance-account.model';
import { DATE_RANGES, DateRangeKey, resolveRange } from '../../models/Wallet filter.model';
import { statusLabel } from '../../models/wallet-transaction.model';
import { AdminWalletService } from '../../services/wallet.service';

interface Section<T> {
  data: T | null;
  loading: boolean;
  error: WalletApiError | null;
}
const idle = <T>(): Section<T> => ({ data: null, loading: false, error: null });

@Component({
  selector: 'app-admin-wallet',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    RevenueChart,
    WalletOverviewCards,
    WalletBalanceBreakdown,
    FinancialAccountCards,
    WalletError,
    WalletExportDialog,
  ],
  templateUrl: './admin-wallet.html',
  styleUrl: './admin-wallet.scss',
})
export class AdminWallet {
  private api = inject(AdminWalletService);

  readonly ranges = DATE_RANGES;
  readonly series = CHART_SERIES;
  readonly date = fmtDateTime;
  readonly kes = kesExact;
  readonly statusLabel = statusLabel;

  rangeKey = signal<DateRangeKey>('30d');
  customFrom = signal('');
  customTo = signal('');
  chartSeries = signal<ChartSeries>('revenue');
  exporting = signal(false);
  exportError = signal('');

  overview = signal<Section<AdminWalletOverview>>(idle());
  accounts = signal<Section<FinancialAccount[]>>(idle());
  charts = signal<Section<WalletChartPoint[]>>(idle());
  recon = signal<Section<ReconciliationSummary>>(idle());

  readonly range = computed(() =>
    resolveRange(this.rangeKey(), { from: this.customFrom(), to: this.customTo() }),
  );
  readonly rangeError = computed(() =>
    this.rangeKey() === 'custom' && !this.range()
      ? 'Choose a start date that is not after the end date.'
      : '',
  );

  readonly chartPoints = computed<ChartPoint[]>(() => {
    const key = this.chartSeries();
    return (this.charts().data ?? []).map((p) => ({
      label: new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      value: p[key],
      display: kesExact(p[key]),
    }));
  });
  readonly chartMeta = computed(() => CHART_SERIES.find((s) => s.key === this.chartSeries())!);

  constructor() {
    void this.refresh();
  }

  async refresh() {
    if (this.rangeError()) return;
    await Promise.all([
      this.loadOverview(),
      this.loadAccounts(),
      this.loadCharts(),
      this.loadRecon(),
    ]);
  }

  private async run<T>(
    sig: { set(v: Section<T>): void; update(fn: (v: Section<T>) => Section<T>): void },
    call: () => Promise<T>,
  ) {
    sig.update((s) => ({ ...s, loading: true, error: null }));
    try {
      sig.set({ data: await call(), loading: false, error: null });
    } catch (e) {
      sig.set({
        data: null,
        loading: false,
        error: e instanceof WalletApiError ? e : new WalletApiError('Something went wrong.'),
      });
    }
  }

  loadOverview() {
    return this.run(this.overview, () => this.api.overview(this.range()));
  }
  loadAccounts() {
    return this.run(this.accounts, () => this.api.accounts());
  }
  loadCharts() {
    return this.run(this.charts, () => this.api.charts(this.range()));
  }
  loadRecon() {
    return this.run(this.recon, () => this.api.reconciliation());
  }

  setRange(k: DateRangeKey) {
    this.rangeKey.set(k);
    if (k !== 'custom') void this.refresh();
  }

  async download() {
    this.exportError.set('');
    const r = this.range();
    try {
      await this.api.exportCsv('transactions', r ? { from: r.from, to: r.to } : {});
      this.exporting.set(false);
    } catch (e) {
      this.exportError.set(e instanceof WalletApiError ? e.message : 'Export failed.');
      this.exporting.set(false);
    }
  }
}
