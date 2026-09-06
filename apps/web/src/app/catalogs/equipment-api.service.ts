import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EquipmentHistory,
  EquipmentSummary,
  NewEquipmentInput,
  NewEquipmentVersionInput,
} from '@lt-offers/domain';
import { VersionedCatalogApi } from './versioned-catalog-api';

@Injectable({ providedIn: 'root' })
export class EquipmentApi extends VersionedCatalogApi<
  EquipmentSummary,
  EquipmentHistory,
  NewEquipmentInput,
  NewEquipmentVersionInput
> {
  constructor() {
    super('/api/catalogs/equipment');
  }

  override list(
    search?: string,
    category?: string,
  ): Observable<EquipmentSummary[]> {
    let params = new HttpParams();
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    if (category && category.trim() !== '') {
      params = params.set('category', category.trim());
    }
    return this.http.get<EquipmentSummary[]>(this.base, { params });
  }

  get(id: number): Observable<EquipmentSummary> {
    return this.http.get<EquipmentSummary>(`${this.base}/${id}`);
  }
}
