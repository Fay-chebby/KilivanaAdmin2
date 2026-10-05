import { Routes } from '@angular/router';

import { DeliveryList } from './pages/delivery-list/delivery-list';
import { DeliveryDetails } from './pages/delivery-details/delivery-details';
import { Tracking } from './pages/tracking/tracking';

export const LOGISTICS_ROUTES: Routes = [
  {
    path: '',
    component: DeliveryList,
    title: 'Deliveries',
  },

  {
    path: ':id/tracking',
    component: Tracking,
    title: 'Delivery Tracking',
  },

  {
    path: ':id',
    component: DeliveryDetails,
    title: 'Delivery Details',
  },
];
