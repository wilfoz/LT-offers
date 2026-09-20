import {
  EquipmentEntity,
  EquipmentVersionEntity,
  EquipmentRepository,
  CivilDate,
  EffectivePeriod,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  CatalogItemNotFoundException,
  NoEffectiveVersionFoundException,
} from '../../../domain';

export interface CreateEquipmentInput {
  code: string;
  description: string;
  category?: string | null;
  externalRentalMonthly?: string | null;
  internalRentalMonthly?: string | null;
  purchasePrice?: string | null;
  depreciationYears?: number | null;
  ownedAvailabilityCount?: number | null;
  fuelMaintenanceMonthly?: string | null;
  effectiveFrom?: string | null;
}

export interface CreateEquipmentVersionInput {
  externalRentalMonthly?: string | null;
  internalRentalMonthly?: string | null;
  purchasePrice?: string | null;
  depreciationYears?: number | null;
  ownedAvailabilityCount?: number | null;
  fuelMaintenanceMonthly?: string | null;
  effectiveFrom: string;
}

export class EquipmentUseCases {
  constructor(private readonly repository: EquipmentRepository) {}

  async create(
    input: CreateEquipmentInput,
    createdBy: string,
    today: CivilDate = CivilDate.today(),
  ): Promise<EquipmentEntity> {
    const existing = await this.repository.findByCode(input.code);
    if (existing) {
      throw new DuplicateCatalogCodeException(input.code);
    }

    const effectiveFrom = input.effectiveFrom
      ? CivilDate.fromString(input.effectiveFrom)
      : today;

    const version = new EquipmentVersionEntity({
      externalRentalMonthly: input.externalRentalMonthly,
      internalRentalMonthly: input.internalRentalMonthly,
      purchasePrice: input.purchasePrice,
      depreciationYears: input.depreciationYears,
      ownedAvailabilityCount: input.ownedAvailabilityCount,
      fuelMaintenanceMonthly: input.fuelMaintenanceMonthly,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    const entity = new EquipmentEntity({
      id: 0,
      code: input.code,
      description: input.description,
      category: input.category,
      versions: [version],
    });

    return this.repository.save(entity);
  }

  async list(
    search?: string,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<EquipmentEntity[]> {
    return this.repository.list({ search });
  }

  async get(
    id: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<{
    entity: EquipmentEntity;
    effectiveVersion: EquipmentVersionEntity;
  }> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Equipamento', id);
    }

    const effective = item.getEffectiveVersion(referenceDate);
    if (!effective) {
      throw new NoEffectiveVersionFoundException('Equipamento');
    }

    return { entity: item, effectiveVersion: effective };
  }

  async listHistory(id: number): Promise<EquipmentEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Equipamento', id);
    }
    return item;
  }

  async createVersion(
    id: number,
    input: CreateEquipmentVersionInput,
    createdBy: string,
  ): Promise<EquipmentVersionEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Equipamento', id);
    }

    const effectiveFrom = CivilDate.fromString(input.effectiveFrom);
    const dateAlreadyUsed = item.versions.some((v) =>
      v.effectivePeriod.effectiveFrom.equals(effectiveFrom),
    );
    if (dateAlreadyUsed) {
      throw new DuplicateVersionDateException();
    }

    const version = new EquipmentVersionEntity({
      equipmentId: id,
      externalRentalMonthly: input.externalRentalMonthly,
      internalRentalMonthly: input.internalRentalMonthly,
      purchasePrice: input.purchasePrice,
      depreciationYears: input.depreciationYears,
      ownedAvailabilityCount: input.ownedAvailabilityCount,
      fuelMaintenanceMonthly: input.fuelMaintenanceMonthly,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    return this.repository.createVersion(id, version);
  }
}
