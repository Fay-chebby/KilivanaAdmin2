import { Routes } from '@angular/router';
import { BuyerList } from './pages/buyer-list/buyer-list';
import { BuyerDetails } from './pages/buyer-details/buyer-details';

export const BUYER_ROUTES: Routes = [
  { path: '', component: BuyerList, title: 'Buyers' },
  { path: ':id', component: BuyerDetails, title: 'Buyer Details' },
];
