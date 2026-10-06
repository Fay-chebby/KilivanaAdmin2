import { Routes } from '@angular/router';

import { PaymentList } from './pages/payment-list/payment-list';
import { PaymentDetails } from './pages/payment-details/payment-details';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    component: PaymentList,
  },
  {
    path: ':id',
    component: PaymentDetails,
  },
];
