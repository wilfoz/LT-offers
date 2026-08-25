import { Injectable } from '@angular/core';
import {
  InsulatorHistory,
  InsulatorSummary,
  NewInsulatorInput,
  NewInsulatorVersionInput,
} from '@lt-offers/domain';
import { VersionedCatalogApi } from './versioned-catalog-api';

@Injectable({ providedIn: 'root' })
export class InsulatorsApi extends VersionedCatalogApi<
  InsulatorSummary,
  InsulatorHistory,
  NewInsulatorInput,
  NewInsulatorVersionInput
> {
  constructor() {
    super('/api/catalogs/insulators');
  }
}
