import { Inject, Injectable } from '@nestjs/common';
import { StakingPaginationQuery } from '@lt-offers/domain';
import {
  StakingTowersRepository,
  StakingCatalogQueryPort,
  STAKING_TOWERS_REPOSITORY_TOKEN,
  STAKING_CATALOG_QUERY_PORT_TOKEN,
  PaginatedStakingTowersResult,
} from '../../domain';

@Injectable()
export class GetPaginatedStakingTowersUseCase {
  constructor(
    @Inject(STAKING_TOWERS_REPOSITORY_TOKEN)
    private readonly towersRepo: StakingTowersRepository,
    @Inject(STAKING_CATALOG_QUERY_PORT_TOKEN)
    private readonly catalogQuery: StakingCatalogQueryPort,
  ) {}

  async execute(
    lineId: number,
    query: StakingPaginationQuery,
  ): Promise<PaginatedStakingTowersResult> {
    await this.catalogQuery.ensureTransmissionLineExists(lineId);

    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(1000, Math.max(1, query.pageSize || 50));

    return this.towersRepo.findPaginated(lineId, {
      ...query,
      page,
      pageSize,
    });
  }
}
