import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ViabilityAssessmentResponse,
  ViabilityParameters,
  ViabilityParametersVersionItem,
} from '@lt-offers/domain';

/**
 * Viabilidade do lote (M13): parâmetros singleton versionados por vigência
 * (RNF-05) e parecer derivado da revisão em termos reais ao WACC regulatório.
 */
@Injectable({ providedIn: 'root' })
export class ViabilityApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/viability';

  getParameters(): Observable<ViabilityParametersVersionItem> {
    return this.http.get<ViabilityParametersVersionItem>(
      `${this.base}/parameters`,
    );
  }

  createParametersVersion(
    input: ViabilityParameters,
  ): Observable<ViabilityParametersVersionItem> {
    return this.http.post<ViabilityParametersVersionItem>(
      `${this.base}/parameters`,
      input,
    );
  }

  assessment(
    offerId: number,
    revisionId: number,
  ): Observable<ViabilityAssessmentResponse> {
    return this.http.get<ViabilityAssessmentResponse>(
      `${this.base}/assessment`,
      { params: { offerId, revisionId } },
    );
  }
}
