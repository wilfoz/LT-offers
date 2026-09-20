import {
  ConductorCableEntity,
  ConductorCableVersionEntity,
  ConductorCablesRepository,
  CivilDate,
  EffectivePeriod,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  CatalogItemNotFoundException,
  NoEffectiveVersionFoundException,
} from '../../../domain';

export interface CreateConductorCableInput {
  code: string;
  description?: string | null;
  weightTonPerKm?: string | null;
  reelLengthM?: string | null;
  diameterMm?: string | null;
  utsKn?: string | null;
  effectiveFrom?: string | null;
}

export interface CreateConductorCableVersionInput {
  description?: string | null;
  weightTonPerKm?: string | null;
  reelLengthM?: string | null;
  diameterMm?: string | null;
  utsKn?: string | null;
  effectiveFrom: string;
}

export class ConductorCablesUseCases {
  constructor(private readonly repository: ConductorCablesRepository) {}

  async create(
    input: CreateConductorCableInput,
    createdBy: string,
    today: CivilDate = CivilDate.today(),
  ): Promise<ConductorCableEntity> {
    const existing = await this.repository.findByCode(input.code);
    if (existing) {
      throw new DuplicateCatalogCodeException(input.code);
    }

    const effectiveFrom = input.effectiveFrom
      ? CivilDate.fromString(input.effectiveFrom)
      : today;

    const version = new ConductorCableVersionEntity({
      description: input.description,
      weightTonPerKm: input.weightTonPerKm,
      reelLengthM: input.reelLengthM,
      diameterMm: input.diameterMm,
      utsKn: input.utsKn,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    const entity = new ConductorCableEntity({
      id: 0,
      code: input.code,
      versions: [version],
    });

    return this.repository.save(entity);
  }

  async list(
    search?: string,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<ConductorCableEntity[]> {
    return this.repository.list({ search });
  }

  async get(
    id: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<{
    entity: ConductorCableEntity;
    effectiveVersion: ConductorCableVersionEntity;
  }> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Cabo condutor', id);
    }

    const effective = item.getEffectiveVersion(referenceDate);
    if (!effective) {
      throw new NoEffectiveVersionFoundException('Cabo condutor');
    }

    return { entity: item, effectiveVersion: effective };
  }

  async listHistory(id: number): Promise<ConductorCableEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Cabo condutor', id);
    }
    return item;
  }

  async createVersion(
    id: number,
    input: CreateConductorCableVersionInput,
    createdBy: string,
  ): Promise<ConductorCableVersionEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Cabo condutor', id);
    }

    const effectiveFrom = CivilDate.fromString(input.effectiveFrom);
    const dateAlreadyUsed = item.versions.some((v) =>
      v.effectivePeriod.effectiveFrom.equals(effectiveFrom),
    );
    if (dateAlreadyUsed) {
      throw new DuplicateVersionDateException();
    }

    const version = new ConductorCableVersionEntity({
      conductorCableId: id,
      description: input.description,
      weightTonPerKm: input.weightTonPerKm,
      reelLengthM: input.reelLengthM,
      diameterMm: input.diameterMm,
      utsKn: input.utsKn,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    return this.repository.createVersion(id, version);
  }
}
