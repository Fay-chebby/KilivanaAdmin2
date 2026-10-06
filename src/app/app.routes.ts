import { Routes } from '@angular/router';

import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { Dashboard } from './features/dashboard/pages/dashboard/dashboard';
import { DeliveryList } from './features/logistics/pages/delivery-list/delivery-list';
import { OrderList } from './features/orders/pages/order-list/order-list';
import { PaymentList } from './features/payments/pages/payment-list/payment-list';
import { KycList } from './features/kyc/pages/kyc-list/kyc-list';
import { DisputeList } from './features/disputes/pages/dispute-list/dispute-list';
import { ReportsDashboard } from './features/reports/pages/reports-dashboard/reports-dashboard';
import { UserList } from './features/users/pages/user-list/user-list';
import { GeneralSettings } from './features/settings/pages/general-settings/general-settings';

import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { Login } from './features/auth/pages/login/login';

import { authGuard } from './core/guards/auth-guard';
import { FARMER_ROUTES } from './features/farmers/Farmers.routes ';
import { SUPPLIER_ROUTES } from './features/suppliers/Supplier.routes';
import { BUYER_ROUTES } from './features/buyers/buyer.routes';
import { DRIVER_ROUTES } from './features/drivers/driver.routes';
import { INSPECTOR_ROUTES } from './features/inspectors/Inspectors.routes';
import { FARM_ROUTES } from './features/farms-crops/farm-crops.routes';
import { PRODUCT_ROUTES } from './features/products/Products.routes';
import { ORDER_ROUTES } from './features/orders/Orders.routes';
import { LOGISTICS_ROUTES } from './features/logistics/Logistics.routes';
import { DISPUTE_ROUTES } from './features/disputes/disputes.routes';
import { KYC_ROUTES } from './features/kyc/kyc.routes';
import { PAYMENT_ROUTES } from './features/payments/Payments.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // PUBLIC ROUTES
  {
    path: '',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        component: Login,
      },
    ],
  },

  // PROTECTED ROUTES
  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
      },

      {
        path: 'farmers',
        children: FARMER_ROUTES,
      },

      {
        path: 'buyers',
        children: BUYER_ROUTES,
      },

      {
        path: 'suppliers',
        children: SUPPLIER_ROUTES,
      },

      {
        path: 'inspectors',
        children: INSPECTOR_ROUTES,
      },

      {
        path: 'drivers',
        children: DRIVER_ROUTES,
      },

      {
        path: 'farms-crops',
        children: FARM_ROUTES,
      },

      {
        path: 'products',
        children: PRODUCT_ROUTES,
      },

      {
        path: 'orders',
        children: ORDER_ROUTES,
      },

      {
        path: 'payments',
        children: PAYMENT_ROUTES,
      },

      {
        path: 'kyc',
        children: KYC_ROUTES,
      },

      {
        path: 'logistics',
        children: LOGISTICS_ROUTES,
      },

      {
        path: 'disputes',
        children: DISPUTE_ROUTES,
      },

      {
        path: 'reports',
        component: ReportsDashboard,
      },

      {
        path: 'users',
        component: UserList,
      },

      {
        path: 'settings',
        component: GeneralSettings,
      },

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
