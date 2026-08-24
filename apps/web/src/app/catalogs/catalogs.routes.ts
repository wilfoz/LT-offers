import { Routes } from '@angular/router';
import { ConductorCableFormComponent } from './conductor-cable-form.component';
import { ConductorCableHistoryComponent } from './conductor-cable-history.component';
import { ConductorCableListComponent } from './conductor-cable-list.component';

export const CATALOGS_ROUTES: Routes = [
  { path: 'conductor-cables', component: ConductorCableListComponent },
  { path: 'conductor-cables/new', component: ConductorCableFormComponent },
  { path: 'conductor-cables/:id/edit', component: ConductorCableFormComponent },
  {
    path: 'conductor-cables/:id/history',
    component: ConductorCableHistoryComponent,
  },
];
