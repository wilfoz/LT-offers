import { AccessDifficulty, StakingPaginationQuery } from '@lt-offers/domain';
import { StakingTower } from '../entities';

export interface StakingBatchFilter {
  towerIds?: number[];
  startStationMeters?: number;
  endStationMeters?: number;
  towerTypeIdFilter?: number;
  soilTypeIdFilter?: number;
}

export interface StakingBatchUpdateData {
  towerTypeId?: number | null;
  soilTypeId?: number | null;
  foundationTypeId?: number | null;
  accessDifficulty?: AccessDifficulty;
  notes?: string | null;
}

export interface StakingSummaryData {
  totalTowers: number;
  minStationMeters: string;
  maxStationMeters: string;
  unassignedSoilCount: number;
  unassignedFoundationCount: number;
  invalidCombinationsCount: number;
}

export interface PaginatedStakingTowersResult {
  items: StakingTower[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: StakingSummaryData;
}

export interface StakingTowersRepository {
  findById(id: number): Promise<StakingTower | null>;
  findByTowerNumber(
    lineId: number,
    towerNumber: string,
  ): Promise<StakingTower | null>;
  findManyByLineId(lineId: number): Promise<StakingTower[]>;
  findPaginated(
    lineId: number,
    query: StakingPaginationQuery,
  ): Promise<PaginatedStakingTowersResult>;
  save(tower: StakingTower): Promise<StakingTower>;
  update(id: number, tower: StakingTower): Promise<StakingTower>;
  delete(id: number): Promise<void>;
  batchUpdate(
    lineId: number,
    filter: StakingBatchFilter,
    updateData: StakingBatchUpdateData,
  ): Promise<number>;
  deleteManyByIds(ids: number[]): Promise<number>;
}
