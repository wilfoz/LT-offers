import { Inject, Injectable } from '@nestjs/common';
import {
  PreliminaryDistributionRepository,
  StakingCatalogQueryPort,
  PRELIMINARY_DISTRIBUTION_REPOSITORY_TOKEN,
  STAKING_CATALOG_QUERY_PORT_TOKEN,
  PreliminaryStakingDistribution,
} from '../../domain';

@Injectable()
export class GetPreliminaryDistributionUseCase {
  constructor(
    @Inject(PRELIMINARY_DISTRIBUTION_REPOSITORY_TOKEN)
    private readonly repo: PreliminaryDistributionRepository,
    @Inject(STAKING_CATALOG_QUERY_PORT_TOKEN)
    private readonly catalogQuery: StakingCatalogQueryPort,
  ) {}

  async execute(
    lineId: number,
  ): Promise<PreliminaryStakingDistribution | null> {
    await this.catalogQuery.ensureTransmissionLineExists(lineId);
    return this.repo.findByLineId(lineId);
  }
}
