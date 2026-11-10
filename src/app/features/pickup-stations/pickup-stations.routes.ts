import { Routes } from '@angular/router';

import { PickupStationList } from './pages/pickup-station-list/pickup-station-list';
import { AddPickupStation } from './pages/add-pickup-station/add-pickup-station';
import { EditPickupStation } from './pages/edit-pickup-station/edit-pickup-station';
import { PickupStationDetails } from './pages/pickup-station-details/pickup-station-details';

export const pickupStationRoutes: Routes = [
  {
    path: '',
    component: PickupStationList,
  },
  {
    path: 'add',
    component: AddPickupStation,
  },
  {
    path: ':id/edit',
    component: EditPickupStation,
  },
  {
    path: ':id',
    component: PickupStationDetails,
  },
];
