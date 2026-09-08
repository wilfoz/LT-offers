import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BatchAssignStakingPayload,
  PaginatedStakingTowers,
  PlsCaddCommitPayload,
  PlsCaddImportPreview,
  PreliminaryStakingDistributionItem,
  PreliminaryStakingDistributionPayload,
  StakingPaginationQuery,
  StakingTowerInput,
  StakingTowerItem,
  StakingValidationSummary,
} from '@lt-offers/domain';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StakingApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/lines';

  getPaginated(
    lineId: number,
    query?: StakingPaginationQuery,
  ): Observable<PaginatedStakingTowers> {
    let params = new HttpParams();
    if (query) {
      if (query.page) params = params.set('page', query.page.toString());
      if (query.pageSize)
        params = params.set('pageSize', query.pageSize.toString());
      if (query.search?.trim())
        params = params.set('search', query.search.trim());
      if (query.towerTypeId !== undefined && query.towerTypeId !== null)
        params = params.set('towerTypeId', query.towerTypeId.toString());
      if (query.soilTypeId !== undefined && query.soilTypeId !== null)
        params = params.set('soilTypeId', query.soilTypeId.toString());
      if (
        query.foundationTypeId !== undefined &&
        query.foundationTypeId !== null
      )
        params = params.set(
          'foundationTypeId',
          query.foundationTypeId.toString(),
        );
      if (query.accessDifficulty)
        params = params.set('accessDifficulty', query.accessDifficulty);
      if (query.minStationMeters !== undefined)
        params = params.set(
          'minStationMeters',
          query.minStationMeters.toString(),
        );
      if (query.maxStationMeters !== undefined)
        params = params.set(
          'maxStationMeters',
          query.maxStationMeters.toString(),
        );
      if (query.sortBy) params = params.set('sortBy', query.sortBy);
      if (query.sortDirection)
        params = params.set('sortDirection', query.sortDirection);
    }
    return this.http.get<PaginatedStakingTowers>(
      `${this.baseUrl}/${lineId}/staking`,
      { params },
    );
  }

  getIntegritySummary(lineId: number): Observable<StakingValidationSummary> {
    return this.http.get<StakingValidationSummary>(
      `${this.baseUrl}/${lineId}/staking/integrity-summary`,
    );
  }

  getPreliminaryDistribution(
    lineId: number,
  ): Observable<PreliminaryStakingDistributionItem | null> {
    return this.http.get<PreliminaryStakingDistributionItem | null>(
      `${this.baseUrl}/${lineId}/staking/preliminary-distribution`,
    );
  }

  savePreliminaryDistribution(
    lineId: number,
    payload: PreliminaryStakingDistributionPayload,
  ): Observable<PreliminaryStakingDistributionItem> {
    return this.http.put<PreliminaryStakingDistributionItem>(
      `${this.baseUrl}/${lineId}/staking/preliminary-distribution`,
      payload,
    );
  }

  previewImport(
    lineId: number,
    file: File,
  ): Observable<PlsCaddImportPreview> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<PlsCaddImportPreview>(
      `${this.baseUrl}/${lineId}/staking/preview-import`,
      formData,
    );
  }

  commitImport(
    lineId: number,
    payload: PlsCaddCommitPayload,
  ): Observable<{
    importedCount: number;
    updatedCount: number;
    preservedCount: number;
  }> {
    return this.http.post<{
      importedCount: number;
      updatedCount: number;
      preservedCount: number;
    }>(`${this.baseUrl}/${lineId}/staking/commit-import`, payload);
  }

  batchAssign(
    lineId: number,
    payload: BatchAssignStakingPayload,
  ): Observable<{ updatedCount: number }> {
    return this.http.post<{ updatedCount: number }>(
      `${this.baseUrl}/${lineId}/staking/batch-assign`,
      payload,
    );
  }

  getTowerById(
    lineId: number,
    towerId: number,
  ): Observable<StakingTowerItem> {
    return this.http.get<StakingTowerItem>(
      `${this.baseUrl}/${lineId}/staking/${towerId}`,
    );
  }

  createTower(
    lineId: number,
    input: StakingTowerInput,
  ): Observable<StakingTowerItem> {
    return this.http.post<StakingTowerItem>(
      `${this.baseUrl}/${lineId}/staking`,
      input,
    );
  }

  updateTower(
    lineId: number,
    towerId: number,
    input: Partial<StakingTowerInput>,
  ): Observable<StakingTowerItem> {
    return this.http.patch<StakingTowerItem>(
      `${this.baseUrl}/${lineId}/staking/${towerId}`,
      input,
    );
  }

  deleteTower(lineId: number, towerId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${lineId}/staking/${towerId}`,
    );
  }
}
