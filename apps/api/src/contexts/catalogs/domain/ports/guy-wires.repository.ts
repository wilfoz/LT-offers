import { GuyWireEntity, GuyWireVersionEntity } from '../entities';

export const GUY_WIRES_REPOSITORY = Symbol('GUY_WIRES_REPOSITORY');

export interface GuyWiresFilter {
  search?: string;
}

export interface GuyWiresRepository {
  findById(id: number): Promise<GuyWireEntity | null>;
  findByCode(code: string): Promise<GuyWireEntity | null>;
  list(filter?: GuyWiresFilter): Promise<GuyWireEntity[]>;
  save(entity: GuyWireEntity): Promise<GuyWireEntity>;
  createVersion(
    guyWireId: number,
    version: GuyWireVersionEntity,
  ): Promise<GuyWireVersionEntity>;
}
