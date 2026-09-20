import { FixedCostEntity, FixedCostVersionEntity } from '../entities';

export const FIXED_COSTS_REPOSITORY = Symbol('FIXED_COSTS_REPOSITORY');

export interface FixedCostsFilter {
  search?: string;
}

export interface FixedCostsRepository {
  findById(id: number): Promise<FixedCostEntity | null>;
  findByCode(code: string): Promise<FixedCostEntity | null>;
  list(filter?: FixedCostsFilter): Promise<FixedCostEntity[]>;
  save(entity: FixedCostEntity): Promise<FixedCostEntity>;
  createVersion(
    fixedCostId: number,
    version: FixedCostVersionEntity,
  ): Promise<FixedCostVersionEntity>;
}
