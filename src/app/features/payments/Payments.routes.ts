import { Routes } from '@angular/router';

import { PaymentList } from './pages/payment-list/payment-list';
import { PaymentReconciliation } from './pages/payment-reconciliation/payment-reconciliation';
import { PaymentDetails } from './pages/payment-details/payment-details';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    component: PaymentList,
  },
  // Must come before ':id', or "reconciliation" would be read as a transaction id.
  {
    path: 'reconciliation',
    component: PaymentReconciliation,
  },
  {
    path: ':id',
    component: PaymentDetails,
  },
];
