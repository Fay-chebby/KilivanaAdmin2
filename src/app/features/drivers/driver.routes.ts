import { Routes } from '@angular/router';

import { DriverList } from './pages/driver-list/driver-list';

import { AddDriver } from './pages/add-driver/add-driver';

import { DriverDetails } from './pages/driver-details/driver-details';

import { EditDriver } from './pages/edit-driver/edit-driver';

export const DRIVER_ROUTES: Routes = [
  { path: '', component: DriverList, title: 'Drivers' },

  { path: 'new', component: AddDriver, title: 'Add Driver' },

  { path: ':id/edit', component: EditDriver, title: 'Edit Driver' },

  { path: ':id', component: DriverDetails, title: 'Driver Details' },
];
