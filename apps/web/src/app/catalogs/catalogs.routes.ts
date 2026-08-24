import { Routes } from '@angular/router';
import { ConductorCableFormComponent } from './conductor-cable-form.component';
import { ConductorCableHistoryComponent } from './conductor-cable-history.component';
import { ConductorCableListComponent } from './conductor-cable-list.component';
import { GroundWireFormComponent } from './ground-wire-form.component';
import { GroundWireHistoryComponent } from './ground-wire-history.component';
import { GroundWireListComponent } from './ground-wire-list.component';
import { GuyWireFormComponent } from './guy-wire-form.component';
import { GuyWireHistoryComponent } from './guy-wire-history.component';
import { GuyWireListComponent } from './guy-wire-list.component';
import { StructureSeriesDetailComponent } from './structure-series-detail.component';
import { StructureSeriesFormComponent } from './structure-series-form.component';
import { StructureSeriesHistoryComponent } from './structure-series-history.component';
import { StructureSeriesListComponent } from './structure-series-list.component';
import { TowerTypeFormComponent } from './tower-type-form.component';
import { TowerTypeHistoryComponent } from './tower-type-history.component';

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
  { path: 'guy-wires', component: GuyWireListComponent },
  { path: 'guy-wires/new', component: GuyWireFormComponent },
  { path: 'guy-wires/:id/edit', component: GuyWireFormComponent },
  { path: 'guy-wires/:id/history', component: GuyWireHistoryComponent },
  { path: 'structure-series', component: StructureSeriesListComponent },
  { path: 'structure-series/new', component: StructureSeriesFormComponent },
  {
    path: 'structure-series/:id/edit',
    component: StructureSeriesFormComponent,
  },
  {
    path: 'structure-series/:id/history',
    component: StructureSeriesHistoryComponent,
  },
  {
    path: 'structure-series/:seriesId/tower-types/new',
    component: TowerTypeFormComponent,
  },
  {
    path: 'structure-series/:seriesId/tower-types/:id/edit',
    component: TowerTypeFormComponent,
  },
  {
    path: 'structure-series/:seriesId/tower-types/:id/history',
    component: TowerTypeHistoryComponent,
  },
  { path: 'structure-series/:id', component: StructureSeriesDetailComponent },
];
