import { PreliminaryStakingDistribution } from '../entities';

export interface PreliminaryDistributionRepository {
  findByLineId(lineId: number): Promise<PreliminaryStakingDistribution | null>;
  save(
    distribution: PreliminaryStakingDistribution,
  ): Promise<PreliminaryStakingDistribution>;
}
