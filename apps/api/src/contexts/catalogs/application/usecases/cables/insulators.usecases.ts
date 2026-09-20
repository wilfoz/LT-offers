import {
  InsulatorEntity,
  InsulatorVersionEntity,
  InsulatorsRepository,
  CivilDate,
  EffectivePeriod,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  CatalogItemNotFoundException,
  NoEffectiveVersionFoundException,
} from '../../../domain';

export interface CreateInsulatorInput {
  code: string;
  description?: string | null;
  type?: string | null;
  manufacturer?: string | null;
  profile?: string | null;
  ruptureStrengthKn?: string | null;
  diameterMm?: string | null;
  spacingMm?: string | null;
  creepageDistanceMm?: string | null;
  effectiveFrom?: string | null;
}

export interface CreateInsulatorVersionInput {
  description?: string | null;
  type?: string | null;
  manufacturer?: string | null;
  profile?: string | null;
  ruptureStrengthKn?: string | null;
  diameterMm?: string | null;
  spacingMm?: string | null;
  creepageDistanceMm?: string | null;
  effectiveFrom: string;
}

export class InsulatorsUseCases {
  constructor(private readonly repository: InsulatorsRepository) {}

  async create(
    input: CreateInsulatorInput,
    createdBy: string,
    today: CivilDate = CivilDate.today(),
  ): Promise<InsulatorEntity> {
    const existing = await this.repository.findByCode(input.code);
    if (existing) {
      throw new DuplicateCatalogCodeException(input.code);
    }

    const effectiveFrom = input.effectiveFrom
      ? CivilDate.fromString(input.effectiveFrom)
      : today;

    const version = new InsulatorVersionEntity({
      description: input.description,
      type: input.type,
      manufacturer: input.manufacturer,
      profile: input.profile,
      ruptureStrengthKn: input.ruptureStrengthKn,
      diameterMm: input.diameterMm,
      spacingMm: input.spacingMm,
      creepageDistanceMm: input.creepageDistanceMm,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    const entity = new InsulatorEntity({
      id: 0,
      code: input.code,
      versions: [version],
    });

    return this.repository.save(entity);
  }

  async list(
    search?: string,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<InsulatorEntity[]> {
    return this.repository.list({ search });
  }

  async get(
    id: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<{
    entity: InsulatorEntity;
    effectiveVersion: InsulatorVersionEntity;
  }> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Isolador', id);
    }

    const effective = item.getEffectiveVersion(referenceDate);
    if (!effective) {
      throw new NoEffectiveVersionFoundException('Isolador');
    }

    return { entity: item, effectiveVersion: effective };
  }

  async listHistory(id: number): Promise<InsulatorEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Isolador', id);
    }
    return item;
  }

  async createVersion(
    id: number,
    input: CreateInsulatorVersionInput,
    createdBy: string,
  ): Promise<InsulatorVersionEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Isolador', id);
    }

    const effectiveFrom = CivilDate.fromString(input.effectiveFrom);
    const dateAlreadyUsed = item.versions.some((v) =>
      v.effectivePeriod.effectiveFrom.equals(effectiveFrom),
    );
    if (dateAlreadyUsed) {
      throw new DuplicateVersionDateException();
    }

    const version = new InsulatorVersionEntity({
      insulatorId: id,
      description: input.description,
      type: input.type,
      manufacturer: input.manufacturer,
      profile: input.profile,
      ruptureStrengthKn: input.ruptureStrengthKn,
      diameterMm: input.diameterMm,
      spacingMm: input.spacingMm,
      creepageDistanceMm: input.creepageDistanceMm,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    return this.repository.createVersion(id, version);
  }
}
