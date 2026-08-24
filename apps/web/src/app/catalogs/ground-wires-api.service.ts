import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  GroundWireHistory,
  GroundWireSummary,
  GroundWireType,
  NewGroundWireInput,
  NewGroundWireVersionInput,
} from '@lt-offers/domain';
import { Observable } from 'rxjs';
import { VersionedCatalogApi } from './versioned-catalog-api';

@Injectable({ providedIn: 'root' })
export class GroundWiresApi extends VersionedCatalogApi<
  GroundWireSummary,
  GroundWireHistory,
  NewGroundWireInput,
  NewGroundWireVersionInput
> {
  constructor() {
    super('/api/catalogs/ground-wires');
  }

  // Variação deste catálogo: filtro por tipo além da busca
  override list(
    search?: string,
    type?: GroundWireType,
  ): Observable<GroundWireSummary[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<GroundWireSummary[]>(this.base, { params });
  }
}
