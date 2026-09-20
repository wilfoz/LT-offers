import {
  ProductionPeriod,
  WorkCrewEntity,
  WorkCrewVersionEntity,
  WorkCrewLaborRoleItem,
  WorkCrewEquipmentItem,
  WorkCrewsRepository,
  LaborRolesRepository,
  EquipmentRepository,
  CivilDate,
  EffectivePeriod,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  CatalogItemNotFoundException,
  NoEffectiveVersionFoundException,
} from '../../../domain';

export interface CreateWorkCrewInput {
  code: string;
  name: string;
  standardProductionRate?: string | null;
  productionUnit?: string | null;
  productionPeriod?: ProductionPeriod | null;
  laborRoles?: WorkCrewLaborRoleItem[];
  equipments?: WorkCrewEquipmentItem[];
  effectiveFrom?: string | null;
}

export interface CreateWorkCrewVersionInput {
  standardProductionRate?: string | null;
  productionUnit?: string | null;
  productionPeriod?: ProductionPeriod | null;
  laborRoles?: WorkCrewLaborRoleItem[];
  equipments?: WorkCrewEquipmentItem[];
  effectiveFrom: string;
}

export class WorkCrewsUseCases {
  constructor(
    private readonly repository: WorkCrewsRepository,
    private readonly laborRolesRepository: LaborRolesRepository,
    private readonly equipmentRepository: EquipmentRepository,
  ) {}

  private async assertCompositionReferencesExist(
    laborRoles?: WorkCrewLaborRoleItem[],
    equipments?: WorkCrewEquipmentItem[],
  ): Promise<void> {
    if (laborRoles && laborRoles.length > 0) {
      for (const lr of laborRoles) {
        const found = await this.laborRolesRepository.findById(lr.laborRoleId);
        if (!found) {
          throw new CatalogItemNotFoundException(
            'Cargo de mão de obra',
            lr.laborRoleId,
          );
        }
      }
    }

    if (equipments && equipments.length > 0) {
      for (const eq of equipments) {
        const found = await this.equipmentRepository.findById(eq.equipmentId);
        if (!found) {
          throw new CatalogItemNotFoundException('Equipamento', eq.equipmentId);
        }
      }
    }
  }

  async create(
    input: CreateWorkCrewInput,
    createdBy: string,
    today: CivilDate = CivilDate.today(),
  ): Promise<WorkCrewEntity> {
    const existing = await this.repository.findByCode(input.code);
    if (existing) {
      throw new DuplicateCatalogCodeException(input.code);
    }

    await this.assertCompositionReferencesExist(
      input.laborRoles,
      input.equipments,
    );

    const effectiveFrom = input.effectiveFrom
      ? CivilDate.fromString(input.effectiveFrom)
      : today;

    const version = new WorkCrewVersionEntity({
      standardProductionRate: input.standardProductionRate,
      productionUnit: input.productionUnit,
      productionPeriod: input.productionPeriod,
      laborRoles: input.laborRoles,
      equipments: input.equipments,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    const entity = new WorkCrewEntity({
      id: 0,
      code: input.code,
      name: input.name,
      versions: [version],
    });

    return this.repository.save(entity);
  }

  async list(
    search?: string,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<WorkCrewEntity[]> {
    return this.repository.list({ search });
  }

  async get(
    id: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<{
    entity: WorkCrewEntity;
    effectiveVersion: WorkCrewVersionEntity;
  }> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Equipe de trabalho', id);
    }

    const effective = item.getEffectiveVersion(referenceDate);
    if (!effective) {
      throw new NoEffectiveVersionFoundException('Equipe de trabalho');
    }

    return { entity: item, effectiveVersion: effective };
  }

  async listHistory(id: number): Promise<WorkCrewEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Equipe de trabalho', id);
    }
    return item;
  }

  async createVersion(
    id: number,
    input: CreateWorkCrewVersionInput,
    createdBy: string,
  ): Promise<WorkCrewVersionEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Equipe de trabalho', id);
    }

    await this.assertCompositionReferencesExist(
      input.laborRoles,
      input.equipments,
    );

    const effectiveFrom = CivilDate.fromString(input.effectiveFrom);
    const dateAlreadyUsed = item.versions.some((v) =>
      v.effectivePeriod.effectiveFrom.equals(effectiveFrom),
    );
    if (dateAlreadyUsed) {
      throw new DuplicateVersionDateException();
    }

    const version = new WorkCrewVersionEntity({
      workCrewId: id,
      standardProductionRate: input.standardProductionRate,
      productionUnit: input.productionUnit,
      productionPeriod: input.productionPeriod,
      laborRoles: input.laborRoles,
      equipments: input.equipments,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    return this.repository.createVersion(id, version);
  }
}
