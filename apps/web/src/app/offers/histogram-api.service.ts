import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ResourceHistogramSummary } from '@lt-offers/domain';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HistogramApiService {
  private readonly http = inject(HttpClient);

  /**
   * Obtém o histograma de recursos de uma linha de transmissão (M08).
   */
  getLineHistogram(lineId: number): Observable<ResourceHistogramSummary> {
    return this.http.get<ResourceHistogramSummary>(
      `/api/lines/${lineId}/histograms/resources`,
    );
  }

  /**
   * Obtém o histograma consolidado de recursos de toda a oferta (M08).
   */
  getOfferConsolidatedHistogram(
    offerId: number,
  ): Observable<ResourceHistogramSummary> {
    return this.http.get<ResourceHistogramSummary>(
      `/api/offers/${offerId}/histograms/consolidated`,
    );
  }
}
