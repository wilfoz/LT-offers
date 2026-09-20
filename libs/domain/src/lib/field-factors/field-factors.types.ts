import { AccessDifficulty } from '../staking/staking';

/**
 * Pesos padronizados de severidade de acesso por torre (RF-18, RF-36, RN-15).
 * NORMAL: 1.00 (sem acréscimo de tempo ou esforço)
 * DIFFICULT: 1.25 (+25% de tempo / esforço)
 * CROSSING: 1.60 (+60% para travessias especiais de rios, serras ou ferrovias)
 */
export const ACCESS_SEVERITY_WEIGHTS: Record<AccessDifficulty, number> = {
  NORMAL: 1.0,
  DIFFICULT: 1.25,
  CROSSING: 1.6,
};

/**
 * Parâmetros e coeficientes de ajuste de campo para cronograma e produtividade.
 */
export interface FieldAdjustmentFactors {
  accessDifficultyFactor: number;
  terrainSlopeFactor?: number;
  vegetationDensityFactor?: number;
}

/**
 * Coeficientes geotécnicos de empolamento, compactação e perdas de materiais (RN-12, RF-24).
 */
export interface GeotechnicalFactors {
  /** Fator de empolamento volumétrico de corte (ex: 0.25 para 25%) */
  soilExpansionFactor: number;
  /** Fator de contração/compactação de reaterro (ex: 0.15 para 15%) */
  compactionFactor: number;
  /** Perda percentual de concreto estrutural (ex: 0.05 para 5%) */
  concreteWasteFactor: number;
  /** Perda percentual de aço de armadura (ex: 0.10 para 10%) */
  steelWasteFactor: number;
}

export type SoilGeotechnicalClass = 'NORMAL' | 'HARD_ROCK' | 'SATURATED_WATER';

/**
 * Padrões de fatores geotécnicos por tipologia de solo.
 */
export const DEFAULT_GEOTECHNICAL_FACTORS: Record<
  SoilGeotechnicalClass,
  GeotechnicalFactors
> = {
  NORMAL: {
    soilExpansionFactor: 0.25,
    compactionFactor: 0.15,
    concreteWasteFactor: 0.05,
    steelWasteFactor: 0.1,
  },
  HARD_ROCK: {
    soilExpansionFactor: 0.4,
    compactionFactor: 0.1,
    concreteWasteFactor: 0.05,
    steelWasteFactor: 0.1,
  },
  SATURATED_WATER: {
    soilExpansionFactor: 0.2,
    compactionFactor: 0.2,
    concreteWasteFactor: 0.05,
    steelWasteFactor: 0.1,
  },
};

/**
 * Dados pluviométricos mensais para produtividade em obras de transmissão (RN-16, RF-37).
 */
export interface PrecipitationMonthData {
  month: number; // 1 (Janeiro) a 12 (Dezembro)
  averageMm: number;
  severityLevel: number; // 1 (Seco) a 5 (Severo)
  productivityFactor: number; // 0.55 a 1.00
}

export type BrazilianRegion =
  'NORTE' | 'NORDESTE' | 'CENTRO_OESTE' | 'SUDESTE' | 'SUL';

export interface PrecipitationUfData {
  uf: string;
  name: string;
  region: BrazilianRegion;
  monthlyData: PrecipitationMonthData[];
}

/**
 * Helper para cálculo do fator médio ponderado de acesso de uma linha de transmissão.
 */
export function calculateWeightedAccessFactor(
  distribution: { difficulty: AccessDifficulty; count: number }[],
): number {
  const totalTowers = distribution.reduce((sum, item) => sum + item.count, 0);
  if (totalTowers === 0) {
    return 1.0;
  }

  const weightedSum = distribution.reduce((sum, item) => {
    const weight = ACCESS_SEVERITY_WEIGHTS[item.difficulty] ?? 1.0;
    return sum + weight * item.count;
  }, 0);

  // Arredonda para 3 casas decimais
  return Math.round((weightedSum / totalTowers) * 1000) / 1000;
}
