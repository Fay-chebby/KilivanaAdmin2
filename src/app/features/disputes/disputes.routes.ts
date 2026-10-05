import { Routes } from '@angular/router';

import { DisputeList } from './pages/dispute-list/dispute-list';
import { DisputeDetails } from './pages/dispute-details/dispute-details';

export const DISPUTE_ROUTES: Routes = [
  {
    path: '',
    component: DisputeList,
  },
  {
    path: ':id',
    component: DisputeDetails,
  },
];
