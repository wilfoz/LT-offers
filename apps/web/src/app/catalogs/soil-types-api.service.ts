import { Injectable } from '@angular/core';
import {
  NewSoilTypeInput,
  NewSoilTypeVersionInput,
  SoilTypeHistory,
  SoilTypeSummary,
} from '@lt-offers/domain';
import { VersionedCatalogApi } from './versioned-catalog-api';

@Injectable({ providedIn: 'root' })
export class SoilTypesApi extends VersionedCatalogApi<
  SoilTypeSummary,
  SoilTypeHistory,
  NewSoilTypeInput,
  NewSoilTypeVersionInput
> {
  constructor() {
    super('/api/catalogs/soil-types');
  }
}
