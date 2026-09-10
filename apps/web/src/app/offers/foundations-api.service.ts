import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  FoundationCalculationResult,
  FoundationTraceabilityItem,
  FoundationVolumeQuantityField,
  LineFoundationSummary,
  MissingFoundationCombination,
} from '@lt-offers/domain';
import { Observable } from 'rxjs';

export interface FoundationValidationResponse {
  transmissionLineId: number;
  totalTowers: number;
  calculatedTowers: number;
  pendingTowers: number;
  hasErrors: boolean;
  missingCombinations: MissingFoundationCombination[];
}

@Injectable({ providedIn: 'root' })
export class FoundationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/lines';

  getQuantities(lineId: number): Observable<LineFoundationSummary> {
    return this.http.get<LineFoundationSummary>(
      `${this.baseUrl}/${lineId}/foundations/quantities`,
    );
  }

  getTraceability(
    lineId: number,
  ): Observable<Record<FoundationVolumeQuantityField, FoundationTraceabilityItem>> {
    return this.http.get<
      Record<FoundationVolumeQuantityField, FoundationTraceabilityItem>
    >(`${this.baseUrl}/${lineId}/foundations/traceability`);
  }

  getValidation(lineId: number): Observable<FoundationValidationResponse> {
    return this.http.get<FoundationValidationResponse>(
      `${this.baseUrl}/${lineId}/foundations/validation`,
    );
  }

  getFullCalculation(lineId: number): Observable<FoundationCalculationResult> {
    return this.http.get<FoundationCalculationResult>(
      `${this.baseUrl}/${lineId}/foundations/full`,
    );
  }
}
