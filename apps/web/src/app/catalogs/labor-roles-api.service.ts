import { Injectable } from '@angular/core';
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
}
