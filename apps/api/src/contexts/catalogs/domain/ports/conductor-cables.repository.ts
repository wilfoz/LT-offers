import { ConductorCableEntity, ConductorCableVersionEntity } from '../entities';

export const CONDUCTOR_CABLES_REPOSITORY = Symbol(
  'CONDUCTOR_CABLES_REPOSITORY',
);

export interface ConductorCablesFilter {
  search?: string;
}

export interface ConductorCablesRepository {
  findById(id: number): Promise<ConductorCableEntity | null>;
  findByCode(code: string): Promise<ConductorCableEntity | null>;
  list(filter?: ConductorCablesFilter): Promise<ConductorCableEntity[]>;
  save(entity: ConductorCableEntity): Promise<ConductorCableEntity>;
  createVersion(
    conductorCableId: number,
    version: ConductorCableVersionEntity,
  ): Promise<ConductorCableVersionEntity>;
}
