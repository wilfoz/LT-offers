import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  LaborRoleHistory,
  LaborRoleSummary,
  NewLaborRoleInput,
  NewLaborRoleVersionInput,
} from '@lt-offers/domain';
import { VersionedCatalogApi } from './versioned-catalog-api';

@Injectable({ providedIn: 'root' })
export class LaborRolesApi extends VersionedCatalogApi<
  LaborRoleSummary,
  LaborRoleHistory,
  NewLaborRoleInput,
  NewLaborRoleVersionInput
> {
  constructor() {
    super('/api/catalogs/labor-roles');
  }

  get(id: number): Observable<LaborRoleSummary> {
    return this.http.get<LaborRoleSummary>(`${this.base}/${id}`);
  }
}
