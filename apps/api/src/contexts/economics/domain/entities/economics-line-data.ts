/**
 * Recorte da linha de transmissão consumido pelos três agregados do
 * contexto (orçamento de serviços, resultado econômico e desembolso).
 * Valores decimais chegam como string (RNF-08).
 */
export interface EconomicsLineData {
  id: number;
  name: string | null;
  refinedLengthKm: string | null;
  reportLengthKm: string | null;
  offerId: number;
}

/**
 * Parâmetros de desembolso repassados pelas rotas de fluxo de caixa.
 */
export interface CashflowQueryParams {
  advanceRate?: number;
  retentionRate?: number;
  billingLag?: number;
}
