import { FoundationTypeEntity, FoundationTypeVersionEntity } from '../entities';

export const FOUNDATION_TYPES_REPOSITORY = Symbol(
  'FOUNDATION_TYPES_REPOSITORY',
);

export interface FoundationTypesFilter {
  search?: string;
}

export interface FoundationTypesRepository {
  findById(id: number): Promise<FoundationTypeEntity | null>;
  findByCode(code: string): Promise<FoundationTypeEntity | null>;
  list(filter?: FoundationTypesFilter): Promise<FoundationTypeEntity[]>;
  save(entity: FoundationTypeEntity): Promise<FoundationTypeEntity>;
  createVersion(
    foundationTypeId: number,
    version: FoundationTypeVersionEntity,
  ): Promise<FoundationTypeVersionEntity>;
}
