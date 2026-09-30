import { Routes } from '@angular/router';

import { FarmList } from './pages/farm-list/farm-list';

import { CropList } from './pages/crop-list/crop-list';

import { AddFarm } from './pages/add-farm/add-farm';

import { FarmDetails } from './pages/farm-details/farm-details';

import { EditFarm } from './pages/edit-farm/edit-farm';

export const FARM_ROUTES: Routes = [
  { path: '', component: FarmList, title: 'Farms' },

  { path: 'crops', component: CropList, title: 'Crops' },

  { path: 'new', component: AddFarm, title: 'Add Farm' },

  { path: ':id/edit', component: EditFarm, title: 'Edit Farm' },

  { path: ':id', component: FarmDetails, title: 'Farm Details' },
];
