import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  NewTowerTypeInput,
  NewTowerTypeVersionInput,
  TowerTypeHistory,
  TowerTypeSummary,
} from '@lt-offers/domain';

/**
 * API de tipos de torre — não estende VersionedCatalogApi: a base assume URL
 * fixa no construtor e aqui todas as rotas dependem do seriesId (limite da
 * extração registrado no design D4 da change catalogo-series-torres).
 */
@Injectable({ providedIn: 'root' })
export class TowerTypesApi {
  private readonly http = inject(HttpClient);

  private base(seriesId: number): string {
    return `/api/catalogs/structure-series/${seriesId}/tower-types`;
  }

  list(seriesId: number): Observable<TowerTypeSummary[]> {
    return this.http.get<TowerTypeSummary[]>(this.base(seriesId));
  }

  history(seriesId: number, id: number): Observable<TowerTypeHistory> {
    return this.http.get<TowerTypeHistory>(
      `${this.base(seriesId)}/${id}/history`,
    );
  }

  create(seriesId: number, input: NewTowerTypeInput): Observable<unknown> {
    return this.http.post(this.base(seriesId), input);
  }

  createVersion(
    seriesId: number,
    id: number,
    input: NewTowerTypeVersionInput,
  ): Observable<unknown> {
    return this.http.post(`${this.base(seriesId)}/${id}/versions`, input);
  }
}
