import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  NewWorkCrewInput,
  NewWorkCrewVersionInput,
  WorkCrewHistory,
  WorkCrewSummary,
} from '@lt-offers/domain';
import { VersionedCatalogApi } from './versioned-catalog-api';

@Injectable({ providedIn: 'root' })
export class WorkCrewsApi extends VersionedCatalogApi<
  WorkCrewSummary,
  WorkCrewHistory,
  NewWorkCrewInput,
  NewWorkCrewVersionInput
> {
  constructor() {
    super('/api/catalogs/work-crews');
  }

  get(id: number): Observable<WorkCrewSummary> {
    return this.http.get<WorkCrewSummary>(`${this.base}/${id}`);
  }
}
