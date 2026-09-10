/**
 * Modelos de quantitativos de cabos condutores e cabos de guarda (M05, RF-23, RN-10, RN-11).
 */

export interface ConductorQuantityItem {
  cableCode: string;
  cableName: string;
  nominalSectionMm2: number;
  weightKgPerKm: number;
  circuits: number;
  phasesPerCircuit: number; // Padrão: 3
  subconductorsPerPhase: number; // 1, 2, 3, 4, 6...
  routeLengthKm: number;
  sagFactorPercent: number; // RN-11: Flecha (ex: 2.5%)
  theoreticalLengthKm: number;
  wasteFactorPercent: number; // RN-10: Perda de lançamento (3.0%)
  wasteLengthKm: number;
  sparePercent: number; // Sobressalente
  spareLengthKm: number;
  totalLengthKm: number;
  totalWeightTons: number;
}

export interface GroundWireQuantityItem {
  cableCode: string;
  cableName: string;
  type: 'STEEL' | 'OPGW';
  weightKgPerKm: number;
  routeLengthKm: number;
  sagFactorPercent: number; // Flecha (ex: 1.5%)
  splicingTowersCount: number;
  downleadPerTowerM: number; // Descida vertical até caixa de emenda (ex: 40m)
  totalDownleadKm: number;
  theoreticalLengthKm: number;
  wasteFactorPercent: number; // 3.0%
  wasteLengthKm: number;
  sparePercent: number;
  spareLengthKm: number;
  totalLengthKm: number;
  totalWeightTons: number;
  fiberCount?: number;
}
