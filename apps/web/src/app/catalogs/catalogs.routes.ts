import { Routes } from '@angular/router';
import { ConductorCableFormComponent } from './conductor-cable-form.component';
import { ConductorCableHistoryComponent } from './conductor-cable-history.component';
import { ConductorCableListComponent } from './conductor-cable-list.component';
import { FoundationTypeFormComponent } from './foundation-type-form.component';
import { FoundationTypeHistoryComponent } from './foundation-type-history.component';
import { FoundationTypeListComponent } from './foundation-type-list.component';
import { FoundationVolumeFormComponent } from './foundation-volume-form.component';
import { FoundationVolumeHistoryComponent } from './foundation-volume-history.component';
import { FoundationVolumeListComponent } from './foundation-volume-list.component';
import { GroundWireFormComponent } from './ground-wire-form.component';
import { GroundWireHistoryComponent } from './ground-wire-history.component';
import { GroundWireListComponent } from './ground-wire-list.component';
import { GuyWireFormComponent } from './guy-wire-form.component';
import { GuyWireHistoryComponent } from './guy-wire-history.component';
import { GuyWireListComponent } from './guy-wire-list.component';
import { InsulatorFormComponent } from './insulator-form.component';
import { InsulatorHistoryComponent } from './insulator-history.component';
import { InsulatorListComponent } from './insulator-list.component';
import { SoilTypeFormComponent } from './soil-type-form.component';
import { SoilTypeHistoryComponent } from './soil-type-history.component';
import { SoilTypeListComponent } from './soil-type-list.component';
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
  { path: 'insulators', component: InsulatorListComponent },
  { path: 'insulators/new', component: InsulatorFormComponent },
  { path: 'insulators/:id/edit', component: InsulatorFormComponent },
  { path: 'insulators/:id/history', component: InsulatorHistoryComponent },
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
  { path: 'soil-types', component: SoilTypeListComponent },
  { path: 'soil-types/new', component: SoilTypeFormComponent },
  { path: 'soil-types/:id/edit', component: SoilTypeFormComponent },
  { path: 'soil-types/:id/history', component: SoilTypeHistoryComponent },
  { path: 'foundation-types', component: FoundationTypeListComponent },
  { path: 'foundation-types/new', component: FoundationTypeFormComponent },
  {
    path: 'foundation-types/:id/edit',
    component: FoundationTypeFormComponent,
  },
  {
    path: 'foundation-types/:id/history',
    component: FoundationTypeHistoryComponent,
  },
  { path: 'foundation-volumes', component: FoundationVolumeListComponent },
  { path: 'foundation-volumes/new', component: FoundationVolumeFormComponent },
  {
    path: 'foundation-volumes/:id/edit',
    component: FoundationVolumeFormComponent,
  },
  {
    path: 'foundation-volumes/:id/history',
    component: FoundationVolumeHistoryComponent,
  },
];
