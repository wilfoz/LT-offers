import { TowerCalculationData } from '@lt-offers/domain';

export interface LineFoundationsPreliminaryDistributionData {
  soilPercentages?: Array<{ id: number; percentage: string | number }>;
  foundationPercentages?: Array<{ id: number; percentage: string | number }>;
}

export interface LineFoundationsQueryData {
  id: number;
  refinedLengthKm?: string | null;
  reportLengthKm?: string | null;
  stakingTowers?: TowerCalculationData[];
  preliminaryStakingDistribution?: LineFoundationsPreliminaryDistributionData | null;
}

export interface LineFoundationsQueryPort {
  findLineFoundationsData(
    lineId: number,
  ): Promise<LineFoundationsQueryData | null>;
}
