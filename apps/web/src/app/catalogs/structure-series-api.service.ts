import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  NewStructureSeriesInput,
  NewStructureSeriesVersionInput,
  StructureSeriesHistory,
  StructureSeriesSummary,
} from '@lt-offers/domain';
import { VersionedCatalogApi } from './versioned-catalog-api';

@Injectable({ providedIn: 'root' })
export class StructureSeriesApi extends VersionedCatalogApi<
  StructureSeriesSummary,
  StructureSeriesHistory,
  NewStructureSeriesInput,
  NewStructureSeriesVersionInput
> {
  constructor() {
    super('/api/catalogs/structure-series');
  }

  /** Resumo vigente de uma série (usado pela página de detalhe). */
  get(id: number): Observable<StructureSeriesSummary> {
    return this.http.get<StructureSeriesSummary>(`${this.base}/${id}`);
  }
}
