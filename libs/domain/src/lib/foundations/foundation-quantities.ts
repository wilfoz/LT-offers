import {
  FoundationVolumeQuantityField,
  FoundationVolumeQuantities,
} from '../catalogs/foundation-volumes';

/**
 * Famílias de materiais de fundações e escavações (M05, RN-12, RN-13).
 */
export const FOUNDATION_MATERIAL_FAMILIES = [
  'EXCAVATION',
  'CONCRETE',
  'STEEL',
  'BACKFILL_FORMWORK',
  'SPECIAL_FOUNDATIONS',
] as const;
export type FoundationMaterialFamily =
  (typeof FOUNDATION_MATERIAL_FAMILIES)[number];

export const FOUNDATION_MATERIAL_FAMILY_LABELS: Record<
  FoundationMaterialFamily,
  string
> = {
  EXCAVATION: 'Escavação',
  CONCRETE: 'Concreto',
  STEEL: 'Aço e Chumbadores',
  BACKFILL_FORMWORK: 'Reaterro e Formas',
  SPECIAL_FOUNDATIONS: 'Estacas e Fundações Especiais',
};

/**
 * Metadados dos campos de quantitativo (nomes legíveis em pt-BR, unidade e família).
 */
export interface FoundationQuantityMetadata {
  field: FoundationVolumeQuantityField;
  code: string;
  name: string;
  family: FoundationMaterialFamily;
  unit: 'm³' | 'kg' | 'm' | 'm²';
  defaultWastePercent: number; // RN-12
}

export const FOUNDATION_QUANTITY_METADATA_MAP: Record<
  FoundationVolumeQuantityField,
  FoundationQuantityMetadata
> = {
  // 1. Escavações
  excavationHardFootingM3: {
    field: 'excavationHardFootingM3',
    code: 'ESC-SAP-DURO',
    name: 'Escavação em Terreno Duro (Sapata)',
    family: 'EXCAVATION',
    unit: 'm³',
    defaultWastePercent: 10, // RN-12: Duro 10%
  },
  excavationNormalFootingM3: {
    field: 'excavationNormalFootingM3',
    code: 'ESC-SAP-NORM',
    name: 'Escavação em Terreno Normal (Sapata)',
    family: 'EXCAVATION',
    unit: 'm³',
    defaultWastePercent: 5, // RN-12: Normal 5%
  },
  excavationWaterFootingM3: {
    field: 'excavationWaterFootingM3',
    code: 'ESC-SAP-AGUA',
    name: 'Escavação com Água (Sapata)',
    family: 'EXCAVATION',
    unit: 'm³',
    defaultWastePercent: 20, // RN-12: Água 20%
  },
  excavationHardPrecastM3: {
    field: 'excavationHardPrecastM3',
    code: 'ESC-PRE-DURO',
    name: 'Escavação em Terreno Duro (Pré-moldado)',
    family: 'EXCAVATION',
    unit: 'm³',
    defaultWastePercent: 10,
  },
  excavationNormalPrecastM3: {
    field: 'excavationNormalPrecastM3',
    code: 'ESC-PRE-NORM',
    name: 'Escavação em Terreno Normal (Pré-moldado)',
    family: 'EXCAVATION',
    unit: 'm³',
    defaultWastePercent: 5,
  },
  excavationWaterPrecastM3: {
    field: 'excavationWaterPrecastM3',
    code: 'ESC-PRE-AGUA',
    name: 'Escavação com Água (Pré-moldado)',
    family: 'EXCAVATION',
    unit: 'm³',
    defaultWastePercent: 20,
  },
  excavationHardPileCapM3: {
    field: 'excavationHardPileCapM3',
    code: 'ESC-BLC-DURO',
    name: 'Escavação em Terreno Duro (Bloco de Estacas)',
    family: 'EXCAVATION',
    unit: 'm³',
    defaultWastePercent: 10,
  },
  excavationNormalPileCapM3: {
    field: 'excavationNormalPileCapM3',
    code: 'ESC-BLC-NORM',
    name: 'Escavação em Terreno Normal (Bloco de Estacas)',
    family: 'EXCAVATION',
    unit: 'm³',
    defaultWastePercent: 5,
  },
  excavationWaterPileCapM3: {
    field: 'excavationWaterPileCapM3',
    code: 'ESC-BLC-AGUA',
    name: 'Escavação com Água (Bloco de Estacas)',
    family: 'EXCAVATION',
    unit: 'm³',
    defaultWastePercent: 20,
  },
  excavationPierM3: {
    field: 'excavationPierM3',
    code: 'ESC-TUBULAO',
    name: 'Escavação de Tubulão',
    family: 'EXCAVATION',
    unit: 'm³',
    defaultWastePercent: 5, // RN-12: Tubulão 5%
  },

  // 2. Concreto
  concreteFootingsM3: {
    field: 'concreteFootingsM3',
    code: 'CONC-SAPATA',
    name: 'Concreto Estrutural de Sapata',
    family: 'CONCRETE',
    unit: 'm³',
    defaultWastePercent: 5, // RN-12: Concreto 5%
  },
  concretePiersM3: {
    field: 'concretePiersM3',
    code: 'CONC-TUBULAO',
    name: 'Concreto de Tubulão / Fuste',
    family: 'CONCRETE',
    unit: 'm³',
    defaultWastePercent: 5,
  },
  concretePileCapsM3: {
    field: 'concretePileCapsM3',
    code: 'CONC-BLOCO',
    name: 'Concreto de Bloco de Estacas',
    family: 'CONCRETE',
    unit: 'm³',
    defaultWastePercent: 5,
  },
  concretePrecastM3: {
    field: 'concretePrecastM3',
    code: 'CONC-PREMOLD',
    name: 'Concreto Pré-moldado',
    family: 'CONCRETE',
    unit: 'm³',
    defaultWastePercent: 5,
  },
  concreteRockM3: {
    field: 'concreteRockM3',
    code: 'CONC-ROCHA',
    name: 'Concreto de Chumbamento em Rocha',
    family: 'CONCRETE',
    unit: 'm³',
    defaultWastePercent: 5,
  },
  regenerationM3: {
    field: 'regenerationM3',
    code: 'CONC-MAGRO',
    name: 'Concreto Magro de Regularização',
    family: 'CONCRETE',
    unit: 'm³',
    defaultWastePercent: 5,
  },
  groutM3: {
    field: 'groutM3',
    code: 'GROUT-NIVEL',
    name: 'Graute de Nivelamento / Base',
    family: 'CONCRETE',
    unit: 'm³',
    defaultWastePercent: 5,
  },

  // 3. Aço e Chumbadores
  steelFootingsKg: {
    field: 'steelFootingsKg',
    code: 'ACO-SAPATA',
    name: 'Aço CA-50 de Sapata',
    family: 'STEEL',
    unit: 'kg',
    defaultWastePercent: 10, // RN-12: Aço de reforço 10%
  },
  steelPiersKg: {
    field: 'steelPiersKg',
    code: 'ACO-TUBULAO',
    name: 'Aço de Tubulão',
    family: 'STEEL',
    unit: 'kg',
    defaultWastePercent: 3, // RN-12: Aço de tubulão 3%
  },
  steelPileCapsKg: {
    field: 'steelPileCapsKg',
    code: 'ACO-BLOCO',
    name: 'Aço de Bloco de Estacas',
    family: 'STEEL',
    unit: 'kg',
    defaultWastePercent: 10,
  },
  steelPrecastKg: {
    field: 'steelPrecastKg',
    code: 'ACO-PREMOLD',
    name: 'Aço de Elementos Pré-moldados',
    family: 'STEEL',
    unit: 'kg',
    defaultWastePercent: 10,
  },
  steelRockKg: {
    field: 'steelRockKg',
    code: 'ACO-TIRANTE-ROCHA',
    name: 'Aço de Ancoragem em Rocha',
    family: 'STEEL',
    unit: 'kg',
    defaultWastePercent: 10,
  },
  steelAnchorBoltsKg: {
    field: 'steelAnchorBoltsKg',
    code: 'ACO-CHUMBADOR',
    name: 'Chumbadores de Fixação (Aço)',
    family: 'STEEL',
    unit: 'kg',
    defaultWastePercent: 5,
  },
  anchorBoltDrillingM: {
    field: 'anchorBoltDrillingM',
    code: 'PERF-CHUMBADOR',
    name: 'Perfuração para Chumbadores em Rocha',
    family: 'STEEL',
    unit: 'm',
    defaultWastePercent: 0,
  },

  // 4. Reaterro e Formas
  backfillSoilM3: {
    field: 'backfillSoilM3',
    code: 'REAT-COMP-SOLO',
    name: 'Reaterro Compactado com Solo Local',
    family: 'BACKFILL_FORMWORK',
    unit: 'm³',
    defaultWastePercent: 0,
  },
  backfillSoilCementM3: {
    field: 'backfillSoilCementM3',
    code: 'REAT-SOLO-CIMENTO',
    name: 'Reaterro em Solo-Cimento',
    family: 'BACKFILL_FORMWORK',
    unit: 'm³',
    defaultWastePercent: 0,
  },
  formworkM2: {
    field: 'formworkM2',
    code: 'FORMA-MADEIRA',
    name: 'Formas de Madeira para Fundações',
    family: 'BACKFILL_FORMWORK',
    unit: 'm²',
    defaultWastePercent: 5,
  },

  // 5. Estacas e Fundações Especiais
  helicalPileM: {
    field: 'helicalPileM',
    code: 'ESTACA-HELICOIDAL',
    name: 'Estaca Helicoidal Metálica',
    family: 'SPECIAL_FOUNDATIONS',
    unit: 'm',
    defaultWastePercent: 0,
  },
  steelPileM: {
    field: 'steelPileM',
    code: 'ESTACA-METALICA',
    name: 'Estaca Perfil Metálico',
    family: 'SPECIAL_FOUNDATIONS',
    unit: 'm',
    defaultWastePercent: 0,
  },
  triconeM: {
    field: 'triconeM',
    code: 'PERF-TRICONE',
    name: 'Perfuração Tricone em Rocha',
    family: 'SPECIAL_FOUNDATIONS',
    unit: 'm',
    defaultWastePercent: 0,
  },
  rootPileM: {
    field: 'rootPileM',
    code: 'ESTACA-RAIZ',
    name: 'Estaca Raiz Injetada',
    family: 'SPECIAL_FOUNDATIONS',
    unit: 'm',
    defaultWastePercent: 0,
  },
  continuousAugerPileM: {
    field: 'continuousAugerPileM',
    code: 'ESTACA-HELICE-CONT',
    name: 'Estaca Hélice Contínua',
    family: 'SPECIAL_FOUNDATIONS',
    unit: 'm',
    defaultWastePercent: 0,
  },
  micropileM: {
    field: 'micropileM',
    code: 'MICROESTACA',
    name: 'Microestacas / Injeção',
    family: 'SPECIAL_FOUNDATIONS',
    unit: 'm',
    defaultWastePercent: 0,
  },
  concretePileM: {
    field: 'concretePileM',
    code: 'ESTACA-CONCRETO',
    name: 'Estaca de Concreto Pré-moldada',
    family: 'SPECIAL_FOUNDATIONS',
    unit: 'm',
    defaultWastePercent: 0,
  },
};

/**
 * Item consolidado de quantitativo de material de fundação.
 */
export interface FoundationMaterialItem {
  field: FoundationVolumeQuantityField;
  code: string;
  name: string;
  family: FoundationMaterialFamily;
  unit: 'm³' | 'kg' | 'm' | 'm²';
  theoreticalQuantity: string; // Formato Decimal, ex: "1250.400"
  wasteFactorPercent: string; // Ex: "5.00"
  wasteQuantity: string; // Formato Decimal, ex: "62.520"
  totalQuantity: string; // theoreticalQuantity + wasteQuantity
}

/**
 * Detalhe de cálculo individual por torre para rastreabilidade (RF-27).
 */
export interface TowerFoundationQuantityDetail {
  theoretical: string;
  wasteFactorPercent: string;
  waste: string;
  total: string;
}

export interface TowerFoundationCalculationItem {
  towerId: number;
  towerNumber: string;
  stationMeters: string;
  towerTypeId?: number | null;
  towerCode?: string | null;
  soilTypeId?: number | null;
  soilCode?: string | null;
  foundationTypeId?: number | null;
  foundationCode?: string | null;
  status: 'CALCULATED' | 'MISSING_DATA' | 'MISSING_COMBINATION';
  quantities: Partial<
    Record<FoundationVolumeQuantityField, TowerFoundationQuantityDetail>
  >;
  notes?: string[];
}

/**
 * Rastreabilidade detalhada por material (RF-27).
 */
export interface FoundationTraceabilityTowerDetail {
  towerNumber: string;
  stationMeters: string;
  towerCode: string;
  soilCode: string;
  foundationCode: string;
  theoreticalUnit: string;
  wastePercent: string;
  totalUnit: string;
}

export interface FoundationTraceabilityItem {
  field: FoundationVolumeQuantityField;
  name: string;
  unit: string;
  totalQuantity: string;
  towersCount: number;
  towerDetails: FoundationTraceabilityTowerDetail[];
}

/**
 * KPIs de alto nível de fundações da linha.
 */
export interface LineFoundationKpis {
  totalExcavationM3: string;
  totalConcreteM3: string;
  totalSteelKg: string;
  totalBackfillM3: string;
  totalSpecialPilesM: string;
  totalLooseDisposalM3?: string;
  totalCompactedBackfillM3?: string;
}

/**
 * Inconsistência de combinação Torre x Solo x Fundação (RF-20).
 */
export interface MissingFoundationCombination {
  towerTypeId?: number | null;
  towerCode?: string | null;
  soilTypeId?: number | null;
  soilCode?: string | null;
  foundationTypeId?: number | null;
  foundationCode?: string | null;
  affectedTowersCount: number;
  affectedTowerNumbers: string[];
}

/**
 * Resumo completo do cálculo de fundações de uma linha de transmissão.
 */
export interface LineFoundationSummary {
  transmissionLineId: number;
  calculationMode: 'STAKING_DETAILED' | 'PRELIMINARY_PARAMETRIC';
  totalTowers: number;
  calculatedTowers: number;
  pendingTowers: number;
  kpis: LineFoundationKpis;
  materials: FoundationMaterialItem[];
  materialsByFamily: Record<FoundationMaterialFamily, FoundationMaterialItem[]>;
  missingCombinations: MissingFoundationCombination[];
}

/**
 * Inputs para execução do motor de cálculo em `libs/calc-engine`.
 */
export interface TowerCalculationData {
  id: number;
  towerNumber: string;
  stationMeters: string | number;
  towerTypeId?: number | null;
  towerCode?: string | null;
  soilTypeId?: number | null;
  soilCode?: string | null;
  foundationTypeId?: number | null;
  foundationCode?: string | null;
}

export interface FoundationMatrixLookupItem {
  towerTypeId: number;
  soilTypeId: number;
  foundationTypeId: number;
  quantities: FoundationVolumeQuantities;
}

export interface PreliminaryDistributionInput {
  totalTowers: number;
  soilPercentages: Array<{ id: number; percentage: string | number }>;
  foundationPercentages: Array<{ id: number; percentage: string | number }>;
  defaultTowerTypeId?: number;
}

export interface FoundationCalculationInput {
  transmissionLineId: number;
  towers?: TowerCalculationData[];
  preliminaryDistribution?: PreliminaryDistributionInput;
  volumeMatrices: FoundationMatrixLookupItem[];
  customWasteFactors?: Partial<
    Record<FoundationVolumeQuantityField, number | string>
  >;
  soilExpansionPercent?: number | string;
  compactionFactorPercent?: number | string;
}

export interface FoundationCalculationResult {
  summary: LineFoundationSummary;
  towerCalculations: TowerFoundationCalculationItem[];
  traceability: Record<
    FoundationVolumeQuantityField,
    FoundationTraceabilityItem
  >;
}

/**
 * Travessias especiais de rodovias, ferrovias, rios e linhas (Aba Travesias / RF-20).
 */
export interface SpecialCrossingItem {
  id: string;
  code: string;
  crossingType: 'HIGHWAY' | 'RAILWAY' | 'RIVER' | 'TRANSMISSION_LINE' | 'OTHER';
  crossingTypeName: string;
  description: string;
  spanMeters: number;
  safetyRequirement: string;
  estimatedCostBrl: number;
}

/**
 * Abertura e reabilitação de acessos por tipo de terreno (Aba Accesos / RF-20).
 */
export interface AccessOpeningItem {
  id: string;
  terrainType: 'FLAT' | 'ROLLING' | 'MOUNTAINOUS' | 'SWAMPY';
  terrainTypeName: string;
  lengthKm: number;
  unitCostPerKm: number;
  totalCostBrl: number;
}

/**
 * Supressão vegetal e limpeza da faixa de servidão (Aba Limpieza / RF-20).
 */
export interface RightOfWayClearingItem {
  id: string;
  clearingType: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  clearingTypeName: string;
  areaHectares: number;
  unitCostPerHa: number;
  totalCostBrl: number;
}

