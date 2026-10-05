import { Routes } from '@angular/router';

import { KycList } from './pages/kyc-list/kyc-list';
import { KycReview } from './pages/kyc-review/kyc-review';

export const KYC_ROUTES: Routes = [
  {
    path: '',
    component: KycList,
  },
  {
    path: ':id',
    component: KycReview,
  },
];
