/**
 * Contratos de domínio para Apontamento de Medições e Curva S (EVM / Análise de Valor Agregado).
 * (Fase F7 do Roadmap - requisitos-calculo-lt.md §10, §13, §14).
 */

export interface PhysicalProgressItem {
  workPackageId?: number;
  wbsCode: string;
  name?: string;
  unit: string;
  plannedCumulativeQty: string;
  actualCumulativeQty: string;
  progressPercent: string; // % de avanço físico do pacote
}

export interface MonthlyProgressRecord {
  id?: number;
  baselineId: number;
  monthNumber: number; // Mês 1..N
  periodDate: string; // YYYY-MM
  physicalProgressPercent: string; // % acumulado realizado
  plannedValueCumulative: string; // PV acumulado (R$)
  earnedValueCumulative: string; // EV acumulado (R$)
  actualCostCumulative: string; // AC acumulado (R$)
  monthlyMeasuredAmount: string; // Medição bruta do mês (R$)
  notes?: string | null;
  createdBy: string;
  createdAt: string;
  workPackageProgress?: PhysicalProgressItem[];
}

export interface EarnedValueMetrics {
  monthNumber: number;
  periodDate: string;
  plannedValue: string; // PV
  earnedValue: string; // EV
  actualCost: string; // AC
  scheduleVariance: string; // SV = EV - PV (R$)
  costVariance: string; // CV = EV - AC (R$)
  schedulePerformanceIndex: string; // SPI = EV / PV (adimensional)
  costPerformanceIndex: string; // CPI = EV / AC (adimensional)
  physicalProgressPercent: string; // % físico
  monthlyMeasuredAmount?: string;
}

export const CURVE_S_STATUS_SUMMARIES = [
  'ON_TRACK',
  'AHEAD_OF_SCHEDULE',
  'BEHIND_SCHEDULE',
  'COST_OVERRUN',
  'CRITICAL_DEVIATION',
] as const;
export type CurveSStatusSummary = (typeof CURVE_S_STATUS_SUMMARIES)[number];

export const CURVE_S_STATUS_LABELS: Record<CurveSStatusSummary, string> = {
  ON_TRACK: 'No Prazo e no Custo',
  AHEAD_OF_SCHEDULE: 'Adiantada',
  BEHIND_SCHEDULE: 'Atrasada (SPI < 0.95)',
  COST_OVERRUN: 'Estouro de Custo (CPI < 0.95)',
  CRITICAL_DEVIATION: 'Desvio Crítico (SPI e CPI < 0.90)',
};

export interface CurveSData {
  baselineId: number;
  totalPlannedValue: string;
  currentPhysicalProgressPercent: string;
  currentSpi: string;
  currentCpi: string;
  statusSummary: CurveSStatusSummary;
  monthlySeries: EarnedValueMetrics[];
}

export interface RecordMonthlyProgressPayload {
  baselineId: number;
  monthNumber: number;
  periodDate: string; // YYYY-MM
  physicalProgressPercent: string; // % físico realizado no corte
  monthlyMeasuredAmount: string; // Valor medido/faturado no mês
  notes?: string | null;
  createdBy: string;
  workPackageProgress?: PhysicalProgressItem[];
}
