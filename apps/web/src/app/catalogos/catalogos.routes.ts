import { Routes } from '@angular/router';
import { FormularioCaboComponent } from './formulario-cabo.component';
import { HistoricoCaboComponent } from './historico-cabo.component';
import { ListaCabosComponent } from './lista-cabos.component';

export const CATALOGOS_ROUTES: Routes = [
  { path: 'cabos-condutores', component: ListaCabosComponent },
  { path: 'cabos-condutores/novo', component: FormularioCaboComponent },
  { path: 'cabos-condutores/:id/editar', component: FormularioCaboComponent },
  {
    path: 'cabos-condutores/:id/historico',
    component: HistoricoCaboComponent,
  },
];
