import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'upload',
    loadComponent: () =>
      import('./upload/upload.component').then((m) => m.UploadComponent),
  },
  {
    path: 'offers',
    loadChildren: () =>
      import('./offers/offers.routes').then((m) => m.OFFERS_ROUTES),
  },
  {
    path: 'catalogs',
    loadChildren: () =>
      import('./catalogs/catalogs.routes').then((m) => m.CATALOGS_ROUTES),
  },
];

