import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FixedCostCategory,
  FixedCostHistory,
  FixedCostSummary,
  NewFixedCostInput,
  NewFixedCostVersionInput,
} from '@lt-offers/domain';
import { VersionedCatalogApi } from './versioned-catalog-api';

@Injectable({ providedIn: 'root' })
export class FixedCostsApi extends VersionedCatalogApi<
  FixedCostSummary,
  FixedCostHistory,
  NewFixedCostInput,
  NewFixedCostVersionInput
> {
  constructor() {
    super('/api/catalogs/fixed-costs');
  }

  override list(
    search?: string,
    category?: FixedCostCategory,
  ): Observable<FixedCostSummary[]> {
    let params = new HttpParams();
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<FixedCostSummary[]>(this.base, { params });
  }

  get(id: number): Observable<FixedCostSummary> {
    return this.http.get<FixedCostSummary>(`${this.base}/${id}`);
  }
}
