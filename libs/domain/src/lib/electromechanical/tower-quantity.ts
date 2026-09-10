/**
 * Modelos e tipos para quantitativos de estruturas e torres metálicas (M05, RF-23, RN-10).
 */

export interface TowerQuantityItem {
  towerTypeId: number;
  towerTypeCode: string;
  towerTypeName: string;
  seriesName?: string;
  heightBodyM: number;
  baseWeightKg: number;
  count: number;
  theoreticalWeightKg: number;
  extraPercent: number; // RN-10: 0,5%
  extraWeightKg: number;
  sparePercent: number; // Spares contratuais
  spareWeightKg: number;
  totalWeightKg: number;
  totalWeightTons: number;
}

export interface TowerTraceabilityDetail {
  towerNumber: string;
  stationMeters: string;
  towerTypeCode: string;
  heightM: number;
  legExtensionM: number;
  nominalWeightKg: number;
  legExtensionWeightKg: number;
  totalStructureWeightKg: number;
}
