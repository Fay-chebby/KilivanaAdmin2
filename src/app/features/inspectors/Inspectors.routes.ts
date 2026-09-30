import { Routes } from '@angular/router';

import { InspectorList } from './pages/inspector-list/inspector-list';

import { AddInspector } from './pages/add-inspector/add-inspector';

import { InspectorDetails } from './pages/inspector-details/inspector-details';

import { EditInspector } from './pages/edit-inspector/edit-inspector';

export const INSPECTOR_ROUTES: Routes = [
  { path: '', component: InspectorList, title: 'Inspectors' },

  { path: 'new', component: AddInspector, title: 'Add Inspector' },

  { path: ':id/edit', component: EditInspector, title: 'Edit Inspector' },

  { path: ':id', component: InspectorDetails, title: 'Inspector Details' },
];
