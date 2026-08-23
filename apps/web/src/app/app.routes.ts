import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'catalogos',
    loadChildren: () =>
      import('./catalogos/catalogos.routes').then((m) => m.CATALOGOS_ROUTES),
  },
];
