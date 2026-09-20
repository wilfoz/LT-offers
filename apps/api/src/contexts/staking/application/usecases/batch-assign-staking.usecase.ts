import { Inject, Injectable } from '@nestjs/common';
import { AccessDifficulty } from '@lt-offers/domain';
import {
  StakingTowersRepository,
  StakingCatalogQueryPort,
  STAKING_TOWERS_REPOSITORY_TOKEN,
  STAKING_CATALOG_QUERY_PORT_TOKEN,
  StakingBatchFilter,
  StakingBatchUpdateData,
} from '../../domain';

export interface BatchAssignStakingInput {
  towerIds?: number[];
  startStationMeters?: number;
  endStationMeters?: number;
  towerTypeIdFilter?: number;
  soilTypeIdFilter?: number;
  assignTowerTypeId?: number | null;
  assignSoilTypeId?: number | null;
  assignFoundationTypeId?: number | null;
  assignAccessDifficulty?: AccessDifficulty;
  assignNotes?: string | null;
}

@Injectable()
export class BatchAssignStakingUseCase {
  constructor(
    @Inject(STAKING_TOWERS_REPOSITORY_TOKEN)
    private readonly towersRepo: StakingTowersRepository,
    @Inject(STAKING_CATALOG_QUERY_PORT_TOKEN)
    private readonly catalogQuery: StakingCatalogQueryPort,
  ) {}

  async execute(
    lineId: number,
    payload: BatchAssignStakingInput,
  ): Promise<{ updatedCount: number }> {
    await this.catalogQuery.ensureTransmissionLineExists(lineId);

    const filter: StakingBatchFilter = {
      towerIds: payload.towerIds,
      startStationMeters: payload.startStationMeters,
      endStationMeters: payload.endStationMeters,
      towerTypeIdFilter: payload.towerTypeIdFilter,
      soilTypeIdFilter: payload.soilTypeIdFilter,
    };

    const updateData: StakingBatchUpdateData = {
      towerTypeId: payload.assignTowerTypeId,
      soilTypeId: payload.assignSoilTypeId,
      foundationTypeId: payload.assignFoundationTypeId,
      accessDifficulty: payload.assignAccessDifficulty,
      notes: payload.assignNotes,
    };

    const updatedCount = await this.towersRepo.batchUpdate(
      lineId,
      filter,
      updateData,
    );

    return { updatedCount };
  }
}
