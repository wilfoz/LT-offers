import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  FoundationApplication,
  FoundationTypeHistory,
  FoundationTypeSummary,
  NewFoundationTypeInput,
  NewFoundationTypeVersionInput,
} from '@lt-offers/domain';
import { Observable } from 'rxjs';
import { VersionedCatalogApi } from './versioned-catalog-api';

@Injectable({ providedIn: 'root' })
export class FoundationTypesApi extends VersionedCatalogApi<
  FoundationTypeSummary,
  FoundationTypeHistory,
  NewFoundationTypeInput,
  NewFoundationTypeVersionInput
> {
  constructor() {
    super('/api/catalogs/foundation-types');
  }

  // Variação deste catálogo: filtro por aplicação além da busca
  override list(
    search?: string,
    application?: FoundationApplication,
  ): Observable<FoundationTypeSummary[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    if (application) {
      params = params.set('application', application);
    }
    return this.http.get<FoundationTypeSummary[]>(this.base, { params });
  }
}
