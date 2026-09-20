import { GroundWireEntity, GroundWireVersionEntity } from '../entities';

export const GROUND_WIRES_REPOSITORY = Symbol('GROUND_WIRES_REPOSITORY');

export interface GroundWiresFilter {
  search?: string;
}

export interface GroundWiresRepository {
  findById(id: number): Promise<GroundWireEntity | null>;
  findByCode(code: string): Promise<GroundWireEntity | null>;
  list(filter?: GroundWiresFilter): Promise<GroundWireEntity[]>;
  save(entity: GroundWireEntity): Promise<GroundWireEntity>;
  createVersion(
    groundWireId: number,
    version: GroundWireVersionEntity,
  ): Promise<GroundWireVersionEntity>;
}
