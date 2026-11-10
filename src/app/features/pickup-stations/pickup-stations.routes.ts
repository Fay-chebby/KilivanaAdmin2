import { Routes } from '@angular/router';

export const pickupStationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/pickup-station-list/pickup-station-list').then((m) => m.PickupStationList),
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./pages/add-pickup-station/add-pickup-station').then((m) => m.AddPickupStation),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/pickup-station-details/pickup-station-details').then(
        (m) => m.PickupStationDetails,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/edit-pickup-station/edit-pickup-station').then((m) => m.EditPickupStation),
  },
];
