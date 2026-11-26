import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinancialAccount } from '../../models/finance-account.model';
import {
  DATE_RANGES,
  DateRangeKey,
  EMPTY_FILTER,
  WalletFilter,
  badAmountRange,
  resolveRange,
} from '../../models/Wallet filter.model';
import {
  STATUS_OPTIONS,
  TXN_TYPE_OPTIONS,
  statusLabel,
} from '../../models/wallet-transaction.model';

@Component({
  selector: 'app-wallet-filter-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './wallet-filter-panel.html',
  styleUrl: './wallet-filter-panel.scss',
})
export class WalletFilterPanel {
  /** transactions shows type and status. ledger shows debit/credit. */
  mode = input<'transactions' | 'ledger'>('transactions');
  filter = input<WalletFilter>(EMPTY_FILTER);
  accounts = input<FinancialAccount[]>([]);
  hideAccount = input(false);

  apply = output<WalletFilter>();

  readonly types = TXN_TYPE_OPTIONS;
  readonly statuses = STATUS_OPTIONS;
  readonly statusLabel = statusLabel;
  readonly ranges = DATE_RANGES;

  draft = signal<WalletFilter>({ ...EMPTY_FILTER });
  rangeKey = signal<DateRangeKey | ''>('');
  expanded = signal(false);

  constructor() {
    effect(
      () => {
        this.draft.set({ ...this.filter() });
      },
      { allowSignalWrites: true },
    );
  }

  readonly amountError = computed(() =>
    badAmountRange(this.draft()) ? 'Minimum amount is higher than the maximum.' : '',
  );
  readonly dateError = computed(() => {
    const d = this.draft();
    return d.from && d.to && d.from > d.to ? 'The start date is after the end date.' : '';
  });
  readonly invalid = computed(() => !!this.amountError() || !!this.dateError());

  set<K extends keyof WalletFilter>(key: K, value: WalletFilter[K]) {
    this.draft.update((d) => ({ ...d, [key]: value }));
  }
  num(v: string): number | null {
    return v === '' ? null : Number(v);
  }

  pickRange(key: DateRangeKey | '') {
    this.rangeKey.set(key);
    if (!key) {
      this.draft.update((d) => ({ ...d, from: '', to: '' }));
      return;
    }
    if (key === 'custom') return;
    const r = resolveRange(key);
    if (r) this.draft.update((d) => ({ ...d, from: r.from, to: r.to }));
  }

  submit() {
    if (this.invalid()) return;
    this.apply.emit({ ...this.draft(), page: 0 });
  }

  reset() {
    this.rangeKey.set('');
    this.draft.set({
      ...EMPTY_FILTER,
      size: this.filter().size,
      sort: this.filter().sort,
      dir: this.filter().dir,
    });
    this.apply.emit(this.draft());
  }
}
