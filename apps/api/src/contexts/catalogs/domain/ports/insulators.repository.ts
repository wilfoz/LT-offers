import { InsulatorEntity, InsulatorVersionEntity } from '../entities';

export const INSULATORS_REPOSITORY = Symbol('INSULATORS_REPOSITORY');

export interface InsulatorsFilter {
  search?: string;
}

export interface InsulatorsRepository {
  findById(id: number): Promise<InsulatorEntity | null>;
  findByCode(code: string): Promise<InsulatorEntity | null>;
  list(filter?: InsulatorsFilter): Promise<InsulatorEntity[]>;
  save(entity: InsulatorEntity): Promise<InsulatorEntity>;
  createVersion(
    insulatorId: number,
    version: InsulatorVersionEntity,
  ): Promise<InsulatorVersionEntity>;
}
