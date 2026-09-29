import { Routes } from '@angular/router';
import { FarmerList } from './pages/farmer-list/farmer-list';
import { AddFarmer } from './pages/add-farmer/add-farmer';
import { FarmerDetails } from './pages/farmer-details/farmer-details';
import { EditFarmer } from './pages/edit-farmer/edit-farmer';

export const FARMER_ROUTES: Routes = [
  { path: '', component: FarmerList, title: 'Farmers' },
  { path: 'new', component: AddFarmer, title: 'Add Farmer' },
  { path: ':id/edit', component: EditFarmer, title: 'Edit Farmer' },
  { path: ':id', component: FarmerDetails, title: 'Farmer Details' },
];
