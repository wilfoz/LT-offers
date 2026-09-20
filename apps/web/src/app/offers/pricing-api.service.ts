import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  LineMaterialPricingSummary,
  MaterialQuote,
  TaxRegime,
} from '@lt-offers/domain';
import { Observable } from 'rxjs';

export interface PricingSimulationPayload {
  taxRegime?: TaxRegime;
  spotLmeUsdPerTon?: number;
  spotMidwestPremiumUsdPerTon?: number;
  spotExchangeRateBrl?: number;
  quotesOverrides?: Record<string, Partial<MaterialQuote>>;
}

@Injectable({ providedIn: 'root' })
export class PricingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/lines';

  /**
   * Obtém o resumo consolidado de preços e tributos de materiais da linha.
   */
  getLinePricingSummary(
    lineId: number,
  ): Observable<LineMaterialPricingSummary> {
    return this.http.get<LineMaterialPricingSummary>(
      `${this.baseUrl}/${lineId}/pricing/summary`,
    );
  }

  /**
   * Executa uma simulação de preços e regimes tributários sob demanda.
   */
  simulateLinePricing(
    lineId: number,
    payload: PricingSimulationPayload,
  ): Observable<LineMaterialPricingSummary> {
    return this.http.post<LineMaterialPricingSummary>(
      `${this.baseUrl}/${lineId}/pricing/simulate`,
      payload,
    );
  }

  /**
   * Obtém o catálogo de cotações padrão.
   */
  getQuotes(lineId: number): Observable<MaterialQuote[]> {
    return this.http.get<MaterialQuote[]>(
      `${this.baseUrl}/${lineId}/pricing/quotes`,
    );
  }
}
