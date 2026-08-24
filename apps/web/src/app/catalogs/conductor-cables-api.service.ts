import { Injectable } from '@angular/core';
import {
  ConductorCableHistory,
  ConductorCableSummary,
  NewConductorCableInput,
  NewConductorCableVersionInput,
} from '@lt-offers/domain';
import { VersionedCatalogApi } from './versioned-catalog-api';

@Injectable({ providedIn: 'root' })
export class ConductorCablesApi extends VersionedCatalogApi<
  ConductorCableSummary,
  ConductorCableHistory,
  NewConductorCableInput,
  NewConductorCableVersionInput
> {
  constructor() {
    super('/api/catalogs/conductor-cables');
  }
}
