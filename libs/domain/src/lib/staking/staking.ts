/**
 * Contratos de domínio para o Módulo M04: Estaqueamento de Torres,
 * Importação PLS-CADD, Atribuições em Lote e Distribuição Paramétrica Preliminar.
 * (RF-18..RF-22, RN-13, RNF-02, RNF-10).
 */

export const ACCESS_DIFFICULTIES = ['NORMAL', 'DIFFICULT', 'CROSSING'] as const;
export type AccessDifficulty = (typeof ACCESS_DIFFICULTIES)[number];

export const ACCESS_DIFFICULTY_LABELS: Record<AccessDifficulty, string> = {
  NORMAL: 'Normal',
  DIFFICULT: 'Difícil',
  CROSSING: 'Travessia',
};

export interface StakingTowerItem {
  id: number;
  transmissionLineId: number;
  towerNumber: string;
  stationMeters: string; // Decimal format string, ex: "1250.50"
  bodyExtensionMeters: string; // Decimal format string, ex: "3.00"
  deflectionAngleDeg: string; // Decimal format string, ex: "12.45"
  lateralOffsetMeters: string; // Decimal format string, ex: "0.00"
  utmEast?: string | null;
  utmNorth?: string | null;
  elevationMeters?: string | null;
  towerTypeId?: number | null;
  soilTypeId?: number | null;
  foundationTypeId?: number | null;
  accessDifficulty: AccessDifficulty;
  notes?: string | null;
  towerType?: { id: number; code: string; name: string } | null;
  soilType?: { id: number; code: string; name: string } | null;
  foundationType?: { id: number; code: string; name: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StakingTowerInput {
  towerNumber: string;
  stationMeters: string | number;
  bodyExtensionMeters?: string | number;
  deflectionAngleDeg?: string | number;
  lateralOffsetMeters?: string | number;
  utmEast?: string | number | null;
  utmNorth?: string | number | null;
  elevationMeters?: string | number | null;
  towerTypeId?: number | null;
  soilTypeId?: number | null;
  foundationTypeId?: number | null;
  accessDifficulty?: AccessDifficulty;
  notes?: string | null;
}

export interface PlsCaddImportParsedRow {
  rowNumber: number;
  towerNumber: string;
  stationMeters: number;
  bodyExtensionMeters: number;
  deflectionAngleDeg: number;
  lateralOffsetMeters: number;
  utmEast?: number | null;
  utmNorth?: number | null;
  elevationMeters?: number | null;
  towerTypeCode?: string | null;
  soilTypeCode?: string | null;
  foundationTypeCode?: string | null;
  isValid: boolean;
  errors: string[];
}

export interface PlsCaddImportPreview {
  fileName: string;
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  newTowersCount: number;
  existingTowersCount: number;
  removedTowersCount: number;
  preservedAttributesCount: number;
  rows: PlsCaddImportParsedRow[];
  globalErrors: string[];
  totalLengthKm: string;
  lineLengthDifferenceKm?: string | null;
}

export interface PlsCaddCommitPayload {
  fileName: string;
  rows: Array<{
    towerNumber: string;
    stationMeters: number;
    bodyExtensionMeters: number;
    deflectionAngleDeg: number;
    lateralOffsetMeters: number;
    utmEast?: number | null;
    utmNorth?: number | null;
    elevationMeters?: number | null;
    towerTypeCode?: string | null;
    soilTypeCode?: string | null;
    foundationTypeCode?: string | null;
  }>;
  preserveExistingAssignments?: boolean;
}

export interface BatchAssignStakingPayload {
  towerIds?: number[];
  startStationMeters?: string | number;
  endStationMeters?: string | number;
  towerTypeIdFilter?: number;
  soilTypeIdFilter?: number;
  assignTowerTypeId?: number | null;
  assignSoilTypeId?: number | null;
  assignFoundationTypeId?: number | null;
  assignAccessDifficulty?: AccessDifficulty;
  assignNotes?: string | null;
}

export interface PreliminaryPercentageItem {
  id: number;
  code?: string;
  name?: string;
  percentage: string; // Ex: "60.00"
}

export interface PreliminaryStakingDistributionPayload {
  soilPercentages: PreliminaryPercentageItem[];
  foundationPercentages: PreliminaryPercentageItem[];
}

export interface PreliminaryStakingDistributionItem {
  id: number;
  transmissionLineId: number;
  soilPercentages: PreliminaryPercentageItem[];
  foundationPercentages: PreliminaryPercentageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StakingPaginationQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  towerTypeId?: number;
  soilTypeId?: number;
  foundationTypeId?: number;
  accessDifficulty?: AccessDifficulty;
  minStationMeters?: number;
  maxStationMeters?: number;
  sortBy?: 'stationMeters' | 'towerNumber';
  sortDirection?: 'asc' | 'desc';
}

export interface StakingSummary {
  totalTowers: number;
  minStationMeters: string;
  maxStationMeters: string;
  unassignedSoilCount: number;
  unassignedFoundationCount: number;
  invalidCombinationsCount: number;
}

export interface PaginatedStakingTowers {
  items: StakingTowerItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: StakingSummary;
}

export interface StakingInvalidCombinationDetail {
  towerNumber: string;
  stationMeters: string;
  soilId: number;
  soilCode: string;
  soilName: string;
  foundationId: number;
  foundationCode: string;
  foundationName: string;
  message: string;
}

export interface StakingValidationSummary {
  hasErrors: boolean;
  totalTowers: number;
  unassignedSoilCount: number;
  unassignedFoundationCount: number;
  invalidCombinationsCount: number;
  invalidCombinations: StakingInvalidCombinationDetail[];
  totalStationLengthKm: string;
  lineRefinedLengthKm: string;
  lengthDiscrepancyKm?: string | null;
}
