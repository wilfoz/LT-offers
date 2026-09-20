import {
  FoundationVolumeEntity,
  FoundationVolumeVersionEntity,
} from '../entities';

export const FOUNDATION_VOLUMES_REPOSITORY = Symbol(
  'FOUNDATION_VOLUMES_REPOSITORY',
);

export interface FoundationVolumesFilter {
  towerTypeId?: number;
  soilTypeId?: number;
  foundationTypeId?: number;
}

export interface FoundationVolumesRepository {
  findById(id: number): Promise<FoundationVolumeEntity | null>;
  findByCombination(
    towerTypeId: number,
    soilTypeId: number,
    foundationTypeId: number,
  ): Promise<FoundationVolumeEntity | null>;
  list(filter?: FoundationVolumesFilter): Promise<FoundationVolumeEntity[]>;
  save(entity: FoundationVolumeEntity): Promise<FoundationVolumeEntity>;
  createVersion(
    foundationVolumeId: number,
    version: FoundationVolumeVersionEntity,
  ): Promise<FoundationVolumeVersionEntity>;
}
