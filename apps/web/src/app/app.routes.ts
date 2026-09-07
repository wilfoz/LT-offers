import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'offers',
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
