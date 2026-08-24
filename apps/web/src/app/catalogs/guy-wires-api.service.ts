import { Injectable } from '@angular/core';
import {
  GuyWireHistory,
  GuyWireSummary,
  NewGuyWireInput,
  NewGuyWireVersionInput,
} from '@lt-offers/domain';
import { VersionedCatalogApi } from './versioned-catalog-api';

@Injectable({ providedIn: 'root' })
export class GuyWiresApi extends VersionedCatalogApi<
  GuyWireSummary,
  GuyWireHistory,
  NewGuyWireInput,
  NewGuyWireVersionInput
> {
  constructor() {
    super('/api/catalogs/guy-wires');
  }
}
