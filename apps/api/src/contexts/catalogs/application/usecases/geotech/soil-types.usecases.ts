import {
  SoilTypeEntity,
  SoilTypeVersionEntity,
  SoilTypesRepository,
  CivilDate,
  EffectivePeriod,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  CatalogItemNotFoundException,
  NoEffectiveVersionFoundException,
} from '../../../domain';

export interface CreateSoilTypeInput {
  code: string;
  description?: string | null;
  submerged?: boolean | null;
  allowableCompressionStressKgfCm2?: string | null;
  specificWeightKgfM3?: string | null;
  internalFrictionAngleDeg?: string | null;
  cohesionKgCm2?: string | null;
  nsptMin?: number | null;
  nsptMax?: number | null;
  effectiveFrom?: string | null;
}

export interface CreateSoilTypeVersionInput {
  description?: string | null;
  submerged?: boolean | null;
  allowableCompressionStressKgfCm2?: string | null;
  specificWeightKgfM3?: string | null;
  internalFrictionAngleDeg?: string | null;
  cohesionKgCm2?: string | null;
  nsptMin?: number | null;
  nsptMax?: number | null;
  effectiveFrom: string;
}

export class SoilTypesUseCases {
  constructor(private readonly repository: SoilTypesRepository) {}

  async create(
    input: CreateSoilTypeInput,
    createdBy: string,
    today: CivilDate = CivilDate.today(),
  ): Promise<SoilTypeEntity> {
    const existing = await this.repository.findByCode(input.code);
    if (existing) {
      throw new DuplicateCatalogCodeException(input.code);
    }

    const effectiveFrom = input.effectiveFrom
      ? CivilDate.fromString(input.effectiveFrom)
      : today;

    const version = new SoilTypeVersionEntity({
      description: input.description,
      submerged: input.submerged,
      allowableCompressionStressKgfCm2: input.allowableCompressionStressKgfCm2,
      specificWeightKgfM3: input.specificWeightKgfM3,
      internalFrictionAngleDeg: input.internalFrictionAngleDeg,
      cohesionKgCm2: input.cohesionKgCm2,
      nsptMin: input.nsptMin,
      nsptMax: input.nsptMax,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    const entity = new SoilTypeEntity({
      id: 0,
      code: input.code,
      versions: [version],
    });

    return this.repository.save(entity);
  }

  async list(
    search?: string,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<SoilTypeEntity[]> {
    return this.repository.list({ search });
  }

  async get(
    id: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<{
    entity: SoilTypeEntity;
    effectiveVersion: SoilTypeVersionEntity;
  }> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Tipo de solo', id);
    }

    const effective = item.getEffectiveVersion(referenceDate);
    if (!effective) {
      throw new NoEffectiveVersionFoundException('Tipo de solo');
    }

    return { entity: item, effectiveVersion: effective };
  }

  async listHistory(id: number): Promise<SoilTypeEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Tipo de solo', id);
    }
    return item;
  }

  async createVersion(
    id: number,
    input: CreateSoilTypeVersionInput,
    createdBy: string,
  ): Promise<SoilTypeVersionEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Tipo de solo', id);
    }

    const effectiveFrom = CivilDate.fromString(input.effectiveFrom);
    const dateAlreadyUsed = item.versions.some((v) =>
      v.effectivePeriod.effectiveFrom.equals(effectiveFrom),
    );
    if (dateAlreadyUsed) {
      throw new DuplicateVersionDateException();
    }

    const version = new SoilTypeVersionEntity({
      soilTypeId: id,
      description: input.description,
      submerged: input.submerged,
      allowableCompressionStressKgfCm2: input.allowableCompressionStressKgfCm2,
      specificWeightKgfM3: input.specificWeightKgfM3,
      internalFrictionAngleDeg: input.internalFrictionAngleDeg,
      cohesionKgCm2: input.cohesionKgCm2,
      nsptMin: input.nsptMin,
      nsptMax: input.nsptMax,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    return this.repository.createVersion(id, version);
  }
}
