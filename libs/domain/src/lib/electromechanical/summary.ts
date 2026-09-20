import { TowerQuantityItem } from './tower-quantity';
import {
  ConductorQuantityItem,
  GroundWireQuantityItem,
} from './cable-quantity';
import {
  InsulatorQuantityItem,
  GuyWireQuantityItem,
  DamperQuantityItem,
  GroundingQuantityItem,
  WarningMarkerQuantityItem,
} from './hardware-quantity';

/**
 * Famílias de suprimentos e materiais eletromecânicos (M05).
 */
export const ELECTROMECHANICAL_FAMILIES = [
  'TOWERS',
  'CONDUCTORS',
  'GROUND_WIRES',
  'INSULATORS',
  'GUY_WIRES',
  'HARDWARE_ACCESSORIES',
  'GROUNDING',
  'ACCESSES_CIVIL',
] as const;

export type ElectromechanicalFamily =
  (typeof ELECTROMECHANICAL_FAMILIES)[number];

export const ELECTROMECHANICAL_FAMILY_LABELS: Record<
  ElectromechanicalFamily,
  string
> = {
  TOWERS: 'Torres e Estruturas Metálicas',
  CONDUCTORS: 'Cabos Condutores de Alumínio',
  GROUND_WIRES: 'Cabos de Guarda (Aço e OPGW)',
  INSULATORS: 'Cadeias de Isoladores',
  GUY_WIRES: 'Tirantes e Cabos de Estaiamento',
  HARDWARE_ACCESSORIES: 'Ferragens, Amortecedores e Sinalização',
  GROUNDING: 'Malha de Aterramento e Contrapesos',
  ACCESSES_CIVIL: 'Acessos, Limpeza de Faixa e Travessias',
};

/**
 * Serviços preliminares, acessos e travessias (RF-25).
 */
export interface AccessQuantityItem {
  accessType: 'OPENING_NEW' | 'RECOVERY_EXISTING' | 'SPECIAL_TRACK';
  description: string;
  unit: 'km';
  lengthKm: number;
}

export interface VegetationClearingItem {
  density: 'LIGHT' | 'MEDIUM' | 'DENSE';
  description: string;
  rightOfWayWidthM: number;
  lengthKm: number;
  areaHectares: number;
}

export interface CrossingItem {
  type: 'HIGHWAY' | 'RAILWAY' | 'RIVER' | 'EXISTING_LINE';
  description: string;
  count: number;
}

/**
 * Item padronizado universal de quantitativo para consumo do motor de preços M06 (RF-26).
 */
export interface ElectromechanicalMaterialItem {
  itemCode: string;
  itemName: string;
  family: ElectromechanicalFamily;
  unit: string;
  theoreticalQuantity: number;
  extraQuantity: number;
  spareQuantity: number;
  totalQuantity: number;
}

/**
 * KPIs de alto nível de quantitativos eletromecânicos.
 */
export interface ElectromechanicalKpis {
  totalTowerSteelTons: number;
  totalConductorKm: number;
  totalConductorTons: number;
  totalGroundWireKm: number;
  totalGroundWireTons: number;
  totalInsulatorUnits: number;
  totalAccessKm: number;
  totalClearingHectares: number;
}

/**
 * Resumo consolidado de quantitativos eletromecânicos da linha de transmissão.
 */
export interface ElectromechanicalSummary {
  lineId: string;
  lineName: string;
  lineLengthKm: number;
  totalTowers: number;
  kpis: ElectromechanicalKpis;
  towers: TowerQuantityItem[];
  conductors: ConductorQuantityItem[];
  groundWires: GroundWireQuantityItem[];
  insulators: InsulatorQuantityItem[];
  guyWires: GuyWireQuantityItem[];
  dampers: DamperQuantityItem[];
  grounding: GroundingQuantityItem[];
  warningMarkers: WarningMarkerQuantityItem[];
  accesses: AccessQuantityItem[];
  vegetationClearing: VegetationClearingItem[];
  crossings: CrossingItem[];
  consolidatedMaterials: ElectromechanicalMaterialItem[];
}
