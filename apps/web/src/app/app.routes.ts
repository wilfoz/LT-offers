import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'catalogs',
    loadChildren: () =>
      import('./catalogs/catalogs.routes').then((m) => m.CATALOGS_ROUTES),
  },
];
