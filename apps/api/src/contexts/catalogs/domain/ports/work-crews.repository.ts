import { WorkCrewEntity, WorkCrewVersionEntity } from '../entities';

export const WORK_CREWS_REPOSITORY = Symbol('WORK_CREWS_REPOSITORY');

export interface WorkCrewsFilter {
  search?: string;
}

export interface WorkCrewsRepository {
  findById(id: number): Promise<WorkCrewEntity | null>;
  findByCode(code: string): Promise<WorkCrewEntity | null>;
  list(filter?: WorkCrewsFilter): Promise<WorkCrewEntity[]>;
  save(entity: WorkCrewEntity): Promise<WorkCrewEntity>;
  createVersion(
    workCrewId: number,
    version: WorkCrewVersionEntity,
  ): Promise<WorkCrewVersionEntity>;
}
