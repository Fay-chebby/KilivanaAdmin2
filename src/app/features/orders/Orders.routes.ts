import { Routes } from '@angular/router';

import { OrderList } from './pages/order-list/order-list';
import { OrderDetails } from './pages/order-details/order-details';

export const ORDER_ROUTES: Routes = [
  {
    path: '',
    component: OrderList,
    title: 'Orders',
  },

  {
    path: ':id',
    component: OrderDetails,
    title: 'Order Details',
  },
];
