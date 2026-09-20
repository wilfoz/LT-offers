/**
 * Coeficientes de venda K e taxas que compõem o BDI da proposta (RF-52).
 */
export interface SaleCoefficients {
  /** Taxa de garantias e cauções contratuais (%). */
  guaranteesRate: string;
  /** Taxa de seguros de riscos de engenharia e responsabilidade civil (%). */
  insurancesRate: string;
  /** Impostos sobre faturamento / produção (PIS/COFINS/ISS faturamento) (%). */
  productionTaxRate: string;
  /** Taxa de IDDE / desenvolvimento (%). */
  iddeRate: string;
  /** Risco país / cliente / regulatório (%). */
  countryRiskRate: string;
  /** Custo financeiro / capital de giro (%). */
  financialCostRate: string;
  /** Contingência técnica / construtiva (%). */
  contingencyRate: string;
  /** Taxa de administração central / estrutura / overhead (%). */
  centralStructureRate: string;
  /** Margem líquida alvo da construtora (%). */
  targetMarginRate: string;
}

/**
 * Decomposição das parcelas de BDI calculadas.
 */
export interface BdiBreakdown {
  /** Soma das taxas indiretas e riscos (%). */
  totalIndirectRate: string;
  /** Margem bruta resultante (%). */
  grossMarginRate: string;
  /** Taxa percentual de BDI efetiva (%). */
  effectiveBdiRate: string;
  /** Multiplicador de BDI sobre o custo próprio (ex.: 1.2850). */
  bdiMultiplier: string;
}

/**
 * Categorias padrão do quadro de resultado econômico (Quadro R).
 */
export type EconomicResultCategory =
  'MATERIALS' | 'SERVICES' | 'INDIRECTS_CAMPS' | 'SPARE_PARTS';

/**
 * Linha detalhada do Quadro R com decomposição de custos e tributos (RF-51).
 */
export interface EconomicResultLine {
  category: EconomicResultCategory;
  description: string;
  /** Custo líquido sem impostos recuperáveis. */
  netCost: string;
  pisCofins: string;
  ipi: string;
  icmsOrigin: string;
  difal: string;
  fecoep: string;
  /** Custo com todos os impostos. */
  costWithTaxes: string;
  /** Parcela faturada diretamente pelo cliente (sem incidência de BDI da construtora). */
  directBilling: string;
  /** Custo próprio que entra na base de BDI da construtora. */
  ownCost: string;
  /** Preço final de venda para o cliente. */
  salePrice: string;
}

/**
 * Resumo consolidado do resultado econômico por linha ou lote (RF-51, RF-52).
 */
export interface EconomicResultSummary {
  lineId?: string;
  lineName?: string;
  offerId: string;
  lines: EconomicResultLine[];
  totalNetCost: string;
  totalPisCofins: string;
  totalIpi: string;
  totalIcmsOrigin: string;
  totalDifal: string;
  totalFecoep: string;
  totalCostWithTaxes: string;
  totalDirectBilling: string;
  totalOwnCost: string;
  totalSalePrice: string;
  grossProfit: string;
  grossMarginPercent: string;
  netMarginPercent: string;
  coefficients: SaleCoefficients;
  bdi: BdiBreakdown;
  ipcaAnnualRate?: string;
  projectDurationMonths?: number;
  ipcaTotalDegradationCost?: string;
}

/**
 * Entrada para simulação de sensibilidade de margem / preço (RF-53).
 */
export interface MarginSimulationInput {
  targetMarginRate?: string;
  forcedSalePrice?: string;
}

/**
 * Saída da simulação de margem / preço (RF-53).
 */
export interface MarginSimulationOutput {
  simulatedSalePrice: string;
  resultingNetMarginRate: string;
  resultingGrossProfit: string;
  effectiveBdiRate: string;
  differenceFromOriginalPrice: string;
}

/**
 * Comparativo analítico de variação entre revisões da mesma oferta (RF-56).
 */
export interface RevisionComparisonResult {
  baseRevisionNumber: number;
  targetRevisionNumber: number;
  baseSalePrice: string;
  targetSalePrice: string;
  deltaSalePrice: string;
  breakdownByCause: {
    materialsQuantityDelta: string;
    materialsPriceDelta: string;
    taxRateDelta: string;
    servicesDelta: string;
    marginCoefficientsDelta: string;
  };
}
