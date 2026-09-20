export type ParityCategory =
  'DISCRETE' | 'PHYSICAL_CONTINUOUS' | 'FINANCIAL_AGGREGATE';

export type ParityMetricStatus =
  'CONFORME' | 'CORRECAO_HOMOLOGADA' | 'DESVIO_DETECTADO';

export interface ParityToleranceConfig {
  discreteMaxDelta: number; // Padrão: 0 (exato)
  physicalMaxRelativePct: number; // Padrão: 0.001%
  financialMaxRelativePct: number; // Padrão: 0.01%
}

export interface ParityMetricComparison {
  id: string;
  module: string;
  metricName: string;
  unit: string;
  category: ParityCategory;
  baselineValue: number;
  calculatedValue: number;
  deltaAbsolute: number;
  deltaRelativePct: number;
  status: ParityMetricStatus;
  technicalNote?: string;
}

export interface ParityModuleSummary {
  module: string;
  totalMetrics: number;
  conformeCount: number;
  correcaoCount: number;
  desvioCount: number;
  status: 'PASSED' | 'FAILED';
}

export interface ParityReport {
  offerCode: string;
  offerName: string;
  profileDescription: string;
  executedAt: string;
  executionDurationMs: number;
  totalMetrics: number;
  conformeCount: number;
  correcaoCount: number;
  desvioCount: number;
  isApproved: boolean;
  toleranceConfig: ParityToleranceConfig;
  modules: ParityModuleSummary[];
  comparisons: ParityMetricComparison[];
}

export interface HistoricalOfferFixture {
  code: string;
  name: string;
  description: string;
  profileType:
    | 'SINGLE_LINE'
    | 'MULTILINE_LOT'
    | 'REIDI_DIRECT_BILL'
    | 'SPECIAL_FOUNDATION';
  nominalVoltageKv: number;
  totalLengthKm: number;
  targetUfs: string[];
  ufSharePct: Record<string, number>;
  inputs: {
    offer: {
      id: string;
      code: string;
      name: string;
      client: string;
      auction: string;
      lot: string;
      currency: string;
      exchangeRate: number;
      reidi: boolean;
    };
    stakingStructures: Array<{
      sequence: number;
      structureNumber: string;
      stationKm: number;
      typeCode: string;
      seriesCode: string;
      heightAdjustmentM: number;
      soilTypeCode: string;
      foundationTypeCode: string;
      accessDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
      clearingVegetation: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'NONE';
      spanAheadM: number;
    }>;
    quotes: Array<{
      itemCode: string;
      category:
        | 'TOWER'
        | 'CONDUCTOR'
        | 'GROUND_WIRE'
        | 'OPGW'
        | 'GUY_WIRE'
        | 'INSULATOR'
        | 'HARDWARE';
      supplier: string;
      originUf: string;
      currency: string;
      netPriceUnit: number;
      ipiAliquot: number;
      icmsAliquot: number;
      isDirectBilling?: boolean;
    }>;
    commodities: {
      lmeSpotUsdPerTon: number;
      midwestPremiumUsdPerTon: number;
      monthlyFuturesLme: Array<{
        monthIndex: number;
        lmeUsdPerTon: number;
        exchangeRateUsd: number;
      }>;
      deliverySchedulePct: Array<{ monthIndex: number; conductorPct: number }>;
    };
    camps: Array<{
      type: 'MAIN' | 'ADVANCED';
      locationKm: number;
      capacityPeople: number;
      setupCost: number;
      monthlyRunningCost: number;
      demobCost: number;
      durationMonths: number;
    }>;
    scheduleActivities: Array<{
      activityCode: string;
      name: string;
      group: 'CIVIL' | 'ERECTION' | 'STRINGING' | 'INDIRECTS';
      quantity: number;
      unit: string;
      workCrewCode: string;
      dailyProductivity: number;
      plannedStartMonth: number;
      durationMonths: number;
    }>;
    economicCoefficients: {
      warrantyInsurancePct: number;
      engineeringRiskPct: number;
      financialCostPct: number;
      unforeseenContingencyPct: number;
      structureOverheadPct: number;
      targetMarginPct: number;
      monthlyIpcaPct: number[];
    };
  };
  expectedBaseline: {
    discrete: Record<string, number>;
    physical: Record<string, number>;
    financial: Record<string, number>;
    knownCorrections?: Record<
      string,
      { baselineLegacyValue: number; correctedValue: number; note: string }
    >;
  };
}
