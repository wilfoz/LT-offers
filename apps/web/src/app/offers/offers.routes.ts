import { Routes } from '@angular/router';

export const OFFERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./offer-list.component').then((m) => m.OfferListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./offer-form.component').then((m) => m.OfferFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./offer-form.component').then((m) => m.OfferFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./offer-detail.component').then((m) => m.OfferDetailComponent),
  },
];
