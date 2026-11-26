import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SellerWalletTable } from '../../components/seller-wallet-table/seller-wallet-table';
import { WalletAccountSummary } from '../../components/wallet-account-summary/wallet-account-summary';
import { WalletError } from '../../components/wallet-error/wallet-error';
import { WalletTransactionsTable } from '../../components/wallet-transactions-table/wallet-transactions-table';
import { Page, WalletApiError } from '../../models/wallet.model';
import { SELLER_TYPE_OPTIONS, SellerWallet } from '../../models/seller-wallet.model';
import { EMPTY_FILTER, WalletFilter } from '../../models/Wallet filter.model';
import { WalletTransaction } from '../../models/wallet-transaction.model';
import { AdminWalletService } from '../../services/wallet.service';

/** /payments/wallet/sellers lists every seller wallet. /payments/wallet/sellers/:id shows one with its transactions. */
@Component({
  selector: 'app-seller-wallets',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    SellerWalletTable,
    WalletAccountSummary,
    WalletTransactionsTable,
    WalletError,
  ],
  templateUrl: './seller-wallets.html',
  styleUrl: './seller-wallets.scss',
})
export class SellerWallets {
  private api = inject(AdminWalletService);
  private router = inject(Router);

  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly typeOptions = SELLER_TYPE_OPTIONS;

  // list
  filter = signal<WalletFilter>({
    ...EMPTY_FILTER,
    sort: 'availableBalance',
    dir: 'desc',
    size: 20,
  });
  sellerType = signal('');
  search = signal('');
  list = signal<Page<SellerWallet> | null>(null);
  loading = signal(false);
  error = signal<WalletApiError | null>(null);

  // detail
  wallet = signal<SellerWallet | null>(null);
  txns = signal<Page<WalletTransaction> | null>(null);
  txnFilter = signal<WalletFilter>({ ...EMPTY_FILTER });
  txnLoading = signal(false);
  txnError = signal<WalletApiError | null>(null);

  readonly title = computed(() => this.wallet()?.sellerName ?? 'Seller');

  constructor() {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (this.id) {
        this.wallet.set(await this.api.sellerWallet(this.id));
        void this.loadTxns();
      } else this.list.set(await this.api.sellerWallets(this.filter(), this.sellerType()));
    } catch (e) {
      this.list.set(null);
      this.error.set(e instanceof WalletApiError ? e : new WalletApiError('Something went wrong.'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadTxns() {
    if (!this.id) return;
    this.txnLoading.set(true);
    this.txnError.set(null);
    try {
      this.txns.set(await this.api.transactions({ ...this.txnFilter(), sellerId: this.id }));
    } catch (e) {
      this.txnError.set(
        e instanceof WalletApiError ? e : new WalletApiError('Something went wrong.'),
      );
    } finally {
      this.txnLoading.set(false);
    }
  }

  submitSearch() {
    this.filter.update((f) => ({ ...f, q: this.search().trim(), page: 0 }));
    void this.load();
  }
  setType(t: string) {
    this.sellerType.set(t);
    this.filter.update((f) => ({ ...f, page: 0 }));
    void this.load();
  }
  goPage(p: number) {
    this.filter.update((f) => ({ ...f, page: p }));
    void this.load();
  }
  sortBy(field: string) {
    this.filter.update((f) => ({
      ...f,
      sort: field,
      dir: f.sort === field && f.dir === 'desc' ? 'asc' : 'desc',
      page: 0,
    }));
    void this.load();
  }

  goTxnPage(p: number) {
    this.txnFilter.update((f) => ({ ...f, page: p }));
    void this.loadTxns();
  }
  sortTxns(field: string) {
    this.txnFilter.update((f) => ({
      ...f,
      sort: field,
      dir: f.sort === field && f.dir === 'desc' ? 'asc' : 'desc',
      page: 0,
    }));
    void this.loadTxns();
  }
  openTxn(t: WalletTransaction) {
    void this.router.navigate(['/payments/wallet/transactions', t.id]);
  }
}
