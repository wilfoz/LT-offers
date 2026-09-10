/**
 * Modelos de ferragens, isoladores, tirantes, sinalização e aterramento (M05, RF-23, RN-10).
 */

export interface InsulatorQuantityItem {
  typeCode: string;
  typeName: string;
  category: 'SUSPENSION' | 'TENSION' | 'POST';
  unit: 'DISCS' | 'STRINGS' | 'SETS';
  stringsCount: number;
  unitsPerString: number;
  theoreticalUnits: number;
  breakageExtraPercent: number; // RN-10: 2% extra
  extraUnits: number;
  sparePercent: number;
  spareUnits: number;
  totalUnits: number;
}

export interface GuyWireQuantityItem {
  cableCode: string;
  cableName: string;
  weightKgPerM: number;
  guyedTowersCount: number;
  guysPerTower: number;
  averageGuyLengthM: number;
  theoreticalLengthM: number;
  extraPercent: number; // 3%
  extraLengthM: number;
  sparePercent: number;
  spareLengthM: number;
  totalLengthM: number;
  totalWeightKg: number;
}

export interface DamperQuantityItem {
  cableType: 'CONDUCTOR' | 'GROUND_WIRE';
  cableCode: string;
  dampersPerSpan: number;
  totalSpans: number;
  theoreticalUnits: number;
  extraPercent: number;
  extraUnits: number;
  totalUnits: number;
}

export interface GroundingQuantityItem {
  itemCode: string;
  itemName: string;
  unit: 'm' | 'un' | 'kg';
  quantityPerTower: number;
  towersCount: number;
  theoreticalQuantity: number;
  extraPercent: number;
  totalQuantity: number;
}

export interface WarningMarkerQuantityItem {
  itemCode: string;
  itemName: string; // Ex: Esfera de Sinalização Laranja/Branca 600mm
  unit: 'un';
  spansWithMarkers: number;
  markersPerSpan: number;
  theoreticalUnits: number;
  spareUnits: number;
  totalUnits: number;
}
