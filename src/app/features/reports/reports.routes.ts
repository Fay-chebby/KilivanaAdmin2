import { Routes } from '@angular/router';

export const REPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/reports-dashboard/reports-dashboard').then((m) => m.ReportsDashboard),
  },

  {
    path: 'details/:reportId',
    loadComponent: () =>
      import('./pages/report-details/report-details').then((m) => m.ReportDetails),
  },
];
