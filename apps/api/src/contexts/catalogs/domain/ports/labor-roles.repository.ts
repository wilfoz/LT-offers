import { LaborRoleEntity, LaborRoleVersionEntity } from '../entities';

export const LABOR_ROLES_REPOSITORY = Symbol('LABOR_ROLES_REPOSITORY');

export interface LaborRolesFilter {
  search?: string;
}

export interface LaborRolesRepository {
  findById(id: number): Promise<LaborRoleEntity | null>;
  findByCode(code: string): Promise<LaborRoleEntity | null>;
  list(filter?: LaborRolesFilter): Promise<LaborRoleEntity[]>;
  save(entity: LaborRoleEntity): Promise<LaborRoleEntity>;
  createVersion(
    laborRoleId: number,
    version: LaborRoleVersionEntity,
  ): Promise<LaborRoleVersionEntity>;
}
