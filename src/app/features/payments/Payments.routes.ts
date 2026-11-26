import { Routes } from '@angular/router';

import { PaymentList } from './pages/payment-list/payment-list';
import { PaymentReconciliation } from './pages/payment-reconciliation/payment-reconciliation';
import { PaymentDetails } from './pages/payment-details/payment-details';

import { AdminWallet } from './wallets/pages/admin-wallet/admin-wallet';
import { SellerWallets } from './wallets/pages/seller-wallets/seller-wallets';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    component: PaymentList,
  },

  // Admin Wallet
  {
    path: 'wallet',
    component: AdminWallet,
  },

  // Seller Wallets
  {
    path: 'seller-wallets',
    component: SellerWallets,
  },

  // Payment reconciliation
  {
    path: 'reconciliation',
    component: PaymentReconciliation,
  },

  // Payment details - keep this last
  {
    path: ':id',
    component: PaymentDetails,
  },
];
