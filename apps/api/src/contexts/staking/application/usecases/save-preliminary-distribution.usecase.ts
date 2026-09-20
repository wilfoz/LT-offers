import { Inject, Injectable } from '@nestjs/common';
import {
  PreliminaryDistributionRepository,
  StakingCatalogQueryPort,
  PRELIMINARY_DISTRIBUTION_REPOSITORY_TOKEN,
  STAKING_CATALOG_QUERY_PORT_TOKEN,
  PreliminaryStakingDistribution,
  PreliminaryPercentages,
  InvalidStakingDistributionException,
} from '../../domain';

export interface SavePreliminaryDistributionInput {
  soilPercentages: Array<{
    itemId: number;
    code: string;
    name: string;
    percentage: number | string;
  }>;
  foundationPercentages: Array<{
    itemId: number;
    code: string;
    name: string;
    percentage: number | string;
  }>;
}

@Injectable()
export class SavePreliminaryDistributionUseCase {
  constructor(
    @Inject(PRELIMINARY_DISTRIBUTION_REPOSITORY_TOKEN)
    private readonly repo: PreliminaryDistributionRepository,
    @Inject(STAKING_CATALOG_QUERY_PORT_TOKEN)
    private readonly catalogQuery: StakingCatalogQueryPort,
  ) {}

  async execute(
    lineId: number,
    payload: SavePreliminaryDistributionInput,
  ): Promise<PreliminaryStakingDistribution> {
    await this.catalogQuery.ensureTransmissionLineExists(lineId);

    try {
      const soilPercentages = new PreliminaryPercentages(
        payload.soilPercentages,
      );
      const foundationPercentages = new PreliminaryPercentages(
        payload.foundationPercentages,
      );

      const existing = await this.repo.findByLineId(lineId);

      if (existing) {
        existing.update(soilPercentages, foundationPercentages);
        return this.repo.save(existing);
      }

      const newDist = new PreliminaryStakingDistribution({
        transmissionLineId: lineId,
        soilPercentages,
        foundationPercentages,
      });

      return this.repo.save(newDist);
    } catch (error) {
      if (error instanceof Error) {
        throw new InvalidStakingDistributionException(error.message);
      }
      throw error;
    }
  }
}
