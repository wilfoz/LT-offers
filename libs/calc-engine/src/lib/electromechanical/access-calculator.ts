import { DecimalValue } from '../decimal-value';
import {
  AccessQuantityItem,
  VegetationClearingItem,
  CrossingItem,
} from '@lt-offers/domain';

export interface AccessInputData {
  accessType: 'OPENING_NEW' | 'RECOVERY_EXISTING' | 'SPECIAL_TRACK';
  description: string;
  lengthKm: number;
}

export interface VegetationClearingInputData {
  density: 'LIGHT' | 'MEDIUM' | 'DENSE';
  description: string;
  rightOfWayWidthM: number;
  lengthKm: number;
}

export interface CrossingInputData {
  type: 'HIGHWAY' | 'RAILWAY' | 'RIVER' | 'EXISTING_LINE';
  description: string;
  count: number;
}

export class AccessQuantityCalculator {
  static calculateAccesses(accesses: AccessInputData[]): AccessQuantityItem[] {
    return accesses.map((a) => ({
      accessType: a.accessType,
      description: a.description,
      unit: 'km',
      lengthKm: DecimalValue.of(a.lengthKm).round(2, 'half-up').toNumber(),
    }));
  }

  static calculateVegetationClearing(
    clearing: VegetationClearingInputData[],
  ): VegetationClearingItem[] {
    return clearing.map((c) => {
      // Área em hectares: (comprimento em km * 1000 m * largura em m) / 10.000 m²/ha
      // = (comprimento km * largura m) / 10
      const areaHa = DecimalValue.of(c.lengthKm)
        .times(DecimalValue.of(c.rightOfWayWidthM))
        .dividedBy(DecimalValue.of(10));

      return {
        density: c.density,
        description: c.description,
        rightOfWayWidthM: c.rightOfWayWidthM,
        lengthKm: DecimalValue.of(c.lengthKm).round(2, 'half-up').toNumber(),
        areaHectares: areaHa.round(2, 'half-up').toNumber(),
      };
    });
  }

  static calculateCrossings(crossings: CrossingInputData[]): CrossingItem[] {
    return crossings.map((cr) => ({
      type: cr.type,
      description: cr.description,
      count: cr.count,
    }));
  }
}
