import { EquipmentEntity, EquipmentVersionEntity } from '../entities';

export const EQUIPMENT_REPOSITORY = Symbol('EQUIPMENT_REPOSITORY');

export interface EquipmentFilter {
  search?: string;
}

export interface EquipmentRepository {
  findById(id: number): Promise<EquipmentEntity | null>;
  findByCode(code: string): Promise<EquipmentEntity | null>;
  list(filter?: EquipmentFilter): Promise<EquipmentEntity[]>;
  save(entity: EquipmentEntity): Promise<EquipmentEntity>;
  createVersion(
    equipmentId: number,
    version: EquipmentVersionEntity,
  ): Promise<EquipmentVersionEntity>;
}
