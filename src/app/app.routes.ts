import { Routes } from '@angular/router';

import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { Dashboard } from './features/dashboard/pages/dashboard/dashboard';
import { FarmList } from './features/farms-crops/pages/farm-list/farm-list';
import { BuyerList } from './features/buyers/pages/buyer-list/buyer-list';
import { SupplierList } from './features/suppliers/pages/supplier-list/supplier-list';
import { InspectorList } from './features/inspectors/pages/inspector-list/inspector-list';
import { DeliveryList } from './features/logistics/pages/delivery-list/delivery-list';
import { FarmerList } from './features/farmers/pages/farmer-list/farmer-list';
import { ProductList } from './features/products/pages/product-list/product-list';
import { OrderList } from './features/orders/pages/order-list/order-list';
import { PaymentList } from './features/payments/pages/payment-list/payment-list';
import { KycList } from './features/kyc/pages/kyc-list/kyc-list';
import { DriverList } from './features/drivers/pages/driver-list/driver-list';
import { DisputeList } from './features/disputes/pages/dispute-list/dispute-list';
import { ReportsDashboard } from './features/reports/pages/reports-dashboard/reports-dashboard';
import { UserList } from './features/users/pages/user-list/user-list';
import { GeneralSettings } from './features/settings/pages/general-settings/general-settings';

import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { Login } from './features/auth/pages/login/login';

import { authGuard } from './core/guards/auth-guard';
import { FARMER_ROUTES } from './features/farmers/Farmers.routes ';

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
        component: BuyerList,
      },

      {
        path: 'suppliers',
        component: SupplierList,
      },

      {
        path: 'inspectors',
        component: InspectorList,
      },

      {
        path: 'drivers',
        component: DriverList,
      },

      {
        path: 'farms-crops',
        component: FarmList,
      },

      {
        path: 'products',
        component: ProductList,
      },

      {
        path: 'orders',
        component: OrderList,
      },

      {
        path: 'payments',
        component: PaymentList,
      },

      {
        path: 'kyc',
        component: KycList,
      },

      {
        path: 'logistics',
        component: DeliveryList,
      },

      {
        path: 'disputes',
        component: DisputeList,
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
