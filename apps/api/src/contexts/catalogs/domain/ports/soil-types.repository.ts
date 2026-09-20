import { SoilTypeEntity, SoilTypeVersionEntity } from '../entities';

export const SOIL_TYPES_REPOSITORY = Symbol('SOIL_TYPES_REPOSITORY');

export interface SoilTypesFilter {
  search?: string;
}

export interface SoilTypesRepository {
  findById(id: number): Promise<SoilTypeEntity | null>;
  findByCode(code: string): Promise<SoilTypeEntity | null>;
  list(filter?: SoilTypesFilter): Promise<SoilTypeEntity[]>;
  save(entity: SoilTypeEntity): Promise<SoilTypeEntity>;
  createVersion(
    soilTypeId: number,
    version: SoilTypeVersionEntity,
  ): Promise<SoilTypeVersionEntity>;
}
