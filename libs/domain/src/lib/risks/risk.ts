/**
 * Categorias padrão de riscos em propostas EPC de Linhas de Transmissão (RF-61).
 */
export type RiskCategory =
  | 'LAND_EASEMENT'
  | 'ENVIRONMENTAL'
  | 'SCHEDULE_TIMELINE'
  | 'WEATHER_RAIN'
  | 'GEOTECHNICAL_SOIL'
  | 'ENGINEERING_INTERFACE'
  | 'THIRD_PARTY_MARKET'
  | 'OTHER';

/**
 * Tratamento do risco na formação do preço de venda (RF-55, RF-61).
 * CONTINGENCY_BDI: adiciona o valor ponderado como contingência na composição do BDI.
 * COMMERCIAL_ASSUMPTION: premissa comercial sem acréscimo de custo na proposta.
 */
export type RiskTreatment = 'CONTINGENCY_BDI' | 'COMMERCIAL_ASSUMPTION';

/**
 * Item individual da Matriz de Riscos de uma linha ou do lote (RF-61).
 */
export interface RiskItem {
  id: string;
  offerId: string;
  lineId?: string;
  category: RiskCategory;
  description: string;
  situation: string;
  mitigationAction: string;
  /** Impacto financeiro bruto estimado em caso de ocorrência (R$). */
  estimatedImpact: string;
  /** Probabilidade de ocorrência estimada (0 a 100%). */
  probabilityPercent: string;
  /** Severidade ponderada calculada: Impacto x Probabilidade / 100 (R$). */
  weightedSeverity: string;
  treatment: RiskTreatment;
}

/**
 * Totalização por categoria de risco.
 */
export interface RiskCategorySummary {
  category: RiskCategory;
  count: number;
  totalImpact: string;
  totalWeightedSeverity: string;
}

/**
 * Resumo consolidado da Matriz de Riscos da oferta ou linha (RF-61, RF-55).
 */
export interface RiskAssessmentSummary {
  offerId: string;
  lineId?: string;
  items: RiskItem[];
  totalEstimatedImpact: string;
  totalWeightedSeverity: string;
  /** Parcela monetária total destinada à contingência do BDI. */
  bdiContingencyAmount: string;
  /** Parcela monetária total assumida como premissa comercial. */
  commercialAssumptionAmount: string;
  categoryBreakdown: RiskCategorySummary[];
}
