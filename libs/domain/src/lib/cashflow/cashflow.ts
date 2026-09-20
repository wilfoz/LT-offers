/**
 * Tipos de itens que compõem a distribuição de desembolso (RF-57).
 */
export type DisbursementItemType =
  'MATERIALS' | 'SERVICES' | 'INDIRECTS' | 'CAMPS';

/**
 * Curva temporal de desembolso mensal por item (RF-57).
 */
export interface DisbursementCurve {
  itemId: string;
  itemCode: string;
  description: string;
  type: DisbursementItemType;
  totalCost: string;
  totalSalePrice: string;
  monthlyCostDistribution: {
    month: number;
    cost: string;
    percentage: string;
  }[];
  monthlyBillingDistribution: {
    month: number;
    billing: string;
    percentage: string;
  }[];
}

/**
 * Ponto do cronograma de entregas de suprimentos / materiais (RF-58).
 */
export interface SupplyDeliverySchedulePoint {
  materialGroup: string;
  month: number;
  tonsOrUnits: string;
  percentage: string;
  estimatedCost: string;
}

/**
 * Ponto mensal do fluxo de caixa consolidado (RF-59).
 */
export interface CashflowMonthPoint {
  month: number;
  materialsOutflow: string;
  servicesOutflow: string;
  indirectsOutflow: string;
  totalOutflow: string;
  accumulatedOutflow: string;
  measurementBilling: string;
  advanceBilling: string;
  totalInflow: string;
  accumulatedInflow: string;
  /** Saldo líquido do mês (TotalInflow - TotalOutflow). */
  netMonthlyCashflow: string;
  /** Saldo acumulado de caixa da obra. */
  accumulatedCashflow: string;
}

/**
 * Indicador de exposição financeira máxima / capital de giro necessário (RF-59).
 */
export interface FinancialExposurePeak {
  /** Mês em que ocorre a maior exposição negativa de caixa. */
  peakMonth: number;
  /** Valor máximo negativo de caixa acumulado (R$). */
  maxNegativeExposure: string;
  /** Capital de giro mínimo recomendado para suportar a obra (R$). */
  recommendedWorkingCapital: string;
}

/**
 * Resumo consolidado do fluxo de caixa e desembolso da proposta (RF-57..RF-60).
 */
export interface CashflowSummary {
  lineId?: string;
  lineName?: string;
  offerId: string;
  totalMonths: number;
  monthlyPoints: CashflowMonthPoint[];
  totalOutflow: string;
  totalInflow: string;
  finalAccumulatedBalance: string;
  financialExposure: FinancialExposurePeak;
  supplyDeliverySchedule?: SupplyDeliverySchedulePoint[];
}
