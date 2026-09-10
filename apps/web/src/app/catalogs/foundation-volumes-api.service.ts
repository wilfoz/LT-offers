import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  FoundationVolumeHistory,
  FoundationVolumeSummary,
  NewFoundationVolumeInput,
  NewFoundationVolumeVersionInput,
} from '@lt-offers/domain';
import { Observable } from 'rxjs';

export interface FoundationVolumeFilters {
  towerTypeId?: number;
  soilTypeId?: number;
  foundationTypeId?: number;
  effectiveOn?: string;
}

/**
 * API da matriz de volumes de fundação — não estende VersionedCatalogApi:
 * criação por tripla de identificadores e filtros de combinação no list
 * (divergência registrada no design D4 da change catalogo-solos-fundacoes).
 */
@Injectable({ providedIn: 'root' })
export class FoundationVolumesApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/catalogs/foundation-volumes';

  list(
    filters?: FoundationVolumeFilters,
  ): Observable<FoundationVolumeSummary[]> {
    let params = new HttpParams();
    if (filters?.towerTypeId !== undefined && filters.towerTypeId !== null) {
      params = params.set('towerTypeId', String(filters.towerTypeId));
    }
    if (filters?.soilTypeId !== undefined && filters.soilTypeId !== null) {
      params = params.set('soilTypeId', String(filters.soilTypeId));
    }
    if (
      filters?.foundationTypeId !== undefined &&
      filters.foundationTypeId !== null
    ) {
      params = params.set('foundationTypeId', String(filters.foundationTypeId));
    }
    if (filters?.effectiveOn) {
      params = params.set('effectiveOn', filters.effectiveOn);
    }
    return this.http.get<FoundationVolumeSummary[]>(this.base, { params });
  }

  get(id: number, effectiveOn?: string): Observable<FoundationVolumeSummary> {
    let params = new HttpParams();
    if (effectiveOn) {
      params = params.set('effectiveOn', effectiveOn);
    }
    return this.http.get<FoundationVolumeSummary>(`${this.base}/${id}`, {
      params,
    });
  }

  history(id: number): Observable<FoundationVolumeHistory> {
    return this.http.get<FoundationVolumeHistory>(`${this.base}/${id}/history`);
  }

  create(input: NewFoundationVolumeInput): Observable<unknown> {
    return this.http.post(this.base, input);
  }

  createVersion(
    id: number,
    input: NewFoundationVolumeVersionInput,
  ): Observable<unknown> {
    return this.http.post(`${this.base}/${id}/versions`, input);
  }
}
