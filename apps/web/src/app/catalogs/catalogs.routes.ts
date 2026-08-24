import { Routes } from '@angular/router';
import { ConductorCableFormComponent } from './conductor-cable-form.component';
import { ConductorCableHistoryComponent } from './conductor-cable-history.component';
import { ConductorCableListComponent } from './conductor-cable-list.component';
import { GroundWireFormComponent } from './ground-wire-form.component';
import { GroundWireHistoryComponent } from './ground-wire-history.component';
import { GroundWireListComponent } from './ground-wire-list.component';

export const CATALOGS_ROUTES: Routes = [
  { path: 'conductor-cables', component: ConductorCableListComponent },
  { path: 'conductor-cables/new', component: ConductorCableFormComponent },
  { path: 'conductor-cables/:id/edit', component: ConductorCableFormComponent },
  {
    path: 'conductor-cables/:id/history',
    component: ConductorCableHistoryComponent,
  },
  { path: 'ground-wires', component: GroundWireListComponent },
  { path: 'ground-wires/new', component: GroundWireFormComponent },
  { path: 'ground-wires/:id/edit', component: GroundWireFormComponent },
  {
    path: 'ground-wires/:id/history',
    component: GroundWireHistoryComponent,
  },
];
