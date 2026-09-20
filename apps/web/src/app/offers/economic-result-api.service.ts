import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EconomicResultSummary,
  SaleCoefficients,
  MarginSimulationInput,
  MarginSimulationOutput,
  RevisionComparisonResult,
} from '@lt-offers/domain';

@Injectable({
  providedIn: 'root',
})
export class EconomicResultApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getLineEconomicResult(lineId: number): Observable<EconomicResultSummary> {
    return this.http.get<EconomicResultSummary>(
      `${this.baseUrl}/lines/${lineId}/economic-result`,
    );
  }

  calculateLineWithCoefficients(
    lineId: number,
    coeffs: Partial<SaleCoefficients>,
  ): Observable<EconomicResultSummary> {
    return this.http.post<EconomicResultSummary>(
      `${this.baseUrl}/lines/${lineId}/economic-result`,
      coeffs,
    );
  }

  getConsolidatedEconomicResult(
    offerId: number,
  ): Observable<EconomicResultSummary> {
    return this.http.get<EconomicResultSummary>(
      `${this.baseUrl}/offers/${offerId}/economic-result/consolidated`,
    );
  }

  simulateMarginOrPrice(
    offerId: number,
    simInput: MarginSimulationInput,
    lineId?: number,
  ): Observable<MarginSimulationOutput> {
    const url = lineId
      ? `${this.baseUrl}/offers/${offerId}/economic-result/simulate?lineId=${lineId}`
      : `${this.baseUrl}/offers/${offerId}/economic-result/simulate`;
    return this.http.post<MarginSimulationOutput>(url, simInput);
  }

  compareRevisions(
    offerId: number,
    baseRev = 0,
    targetRev = 1,
  ): Observable<RevisionComparisonResult> {
    return this.http.get<RevisionComparisonResult>(
      `${this.baseUrl}/offers/${offerId}/economic-result/compare?baseRev=${baseRev}&targetRev=${targetRev}`,
    );
  }
}
