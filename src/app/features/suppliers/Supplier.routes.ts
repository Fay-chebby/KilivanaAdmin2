import { Routes } from '@angular/router';

export const SUPPLIER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/supplier-list/supplier-list').then((m) => m.SupplierList),
  },
  {
    path: 'add',
    loadComponent: () => import('./pages/add-supplier/add-supplier').then((m) => m.AddSupplier),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/supplier-details/supplier-details').then((m) => m.SupplierDetails),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/edit-supplier/edit-supplier').then((m) => m.EditSupplier),
  },
];
