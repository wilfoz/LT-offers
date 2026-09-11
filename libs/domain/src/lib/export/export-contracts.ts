/**
 * Layouts padrão suportados para emissão da Planilha de Preços do Edital (RF-50).
 */
export type TenderSheetLayout =
  | 'ANEEL_STANDARD'
  | 'CELEO_STANDARD'
  | 'GENERIC_EPC';

/**
 * Linha hierárquica da Planilha de Preços do Edital com código CIP (RF-47, RF-50).
 */
export interface TenderSheetRow {
  cipCode: string;
  description: string;
  unit: string;
  quantity: string;
  directUnitCost: string;
  directTotalCost: string;
  bdiRate: string;
  unitPrice: string;
  totalPrice: string;
  group?: string;
  level?: number;
  isTotal?: boolean;
}

/**
 * Conjunto de dados estruturados para exportação da Planilha de Preços do Edital (RF-47, RF-50).
 */
export interface TenderSheetExportData {
  offerId: string;
  offerName: string;
  revisionNumber: number;
  layout: TenderSheetLayout;
  generatedAt: string;
  rows: TenderSheetRow[];
  totalDirectCost: string;
  totalSalePrice: string;
  effectiveBdi: string;
}

/**
 * Linha da Folha de Medição Contratual e Preços Unitários (RF-48).
 */
export interface MeasurementSheetRow {
  itemCode: string;
  discipline: string;
  description: string;
  unit: string;
  contractQuantity: string;
  measurementCriteria: string;
  unitPriceWithTax: string;
  totalContractPrice: string;
  lineId?: string;
  lineName?: string;
}

/**
 * Estrutura para exportação das Folhas de Medição e PUs (RF-48).
 */
export interface MeasurementSheetExportData {
  offerId: string;
  offerName: string;
  revisionNumber: number;
  generatedAt: string;
  items: MeasurementSheetRow[];
  totalContractAmount: string;
}

/**
 * Item mensal de cronograma de faturamento e desembolso (RF-60).
 */
export interface CashflowMonthExportRow {
  monthIndex: number;
  monthLabel: string;
  suppliesDisbursement: string;
  servicesDisbursement: string;
  indirectDisbursement: string;
  monthlyTotalDisbursement: string;
  accumulatedDisbursement: string;
  monthlyBilling: string;
  accumulatedBilling: string;
  netCashflow: string;
  isPeakExposure?: boolean;
}

/**
 * Dados de fluxo de caixa e curva S para exportação (RF-60).
 */
export interface CashflowExportData {
  offerId: string;
  offerName: string;
  revisionNumber: number;
  generatedAt: string;
  months: CashflowMonthExportRow[];
  peakExposureMonth: number;
  peakExposureAmount: string;
  totalDisbursement: string;
  totalBilling: string;
}

/**
 * Indicadores paramétricos sintéticos de performance e custo (RF-49).
 */
export interface PerformanceIndicators {
  lineId?: string;
  lineName?: string;
  lengthKm: string;
  towerCount: number;
  costPerKm: string;
  costPerTower: string;
  suppliesCostPerKm: string;
  suppliesCostPerTower: string;
  servicesCostPerKm: string;
  servicesCostPerTower: string;
  structuresDensityPerKm: string;
  averageSpanMeters: string;
  concretePerKm: string;
  concretePerTower: string;
  steelPerKm: string;
  steelPerTower: string;
}

/**
 * Sumário de indicadores de performance consolidados e por linha (RF-49).
 */
export interface PerformanceIndicatorsSummary {
  offerId: string;
  consolidated: PerformanceIndicators;
  byLine: PerformanceIndicators[];
}

/**
 * Metadados e pacote integral aberto da oferta em JSON (RNF-18).
 */
export interface FullOfferPackage {
  metadata: {
    exportTimestamp: string;
    version: string;
    schemaVersion: string;
    exportedBy?: string;
  };
  offer: Record<string, unknown>;
  transmissionLines: Array<Record<string, unknown>>;
  staking: Array<Record<string, unknown>>;
  pricingSummary: Record<string, unknown>;
  bdiParameters: Record<string, unknown>;
  cashflow: Record<string, unknown>;
  risks: Array<Record<string, unknown>>;
  governance: Record<string, unknown>;
  performanceIndicators: PerformanceIndicatorsSummary;
}
