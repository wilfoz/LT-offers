import { TowerTypeEntity, TowerTypeVersionEntity } from '../entities';

export const TOWER_TYPES_REPOSITORY = Symbol('TOWER_TYPES_REPOSITORY');

export interface TowerTypesRepository {
  findById(id: number): Promise<TowerTypeEntity | null>;
  findBySeriesAndCode(
    structureSeriesId: number,
    code: string,
  ): Promise<TowerTypeEntity | null>;
  listBySeries(structureSeriesId: number): Promise<TowerTypeEntity[]>;
  save(entity: TowerTypeEntity): Promise<TowerTypeEntity>;
  createVersion(
    towerTypeId: number,
    version: TowerTypeVersionEntity,
  ): Promise<TowerTypeVersionEntity>;
}
