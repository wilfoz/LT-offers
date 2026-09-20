import {
  GroundWireEntity,
  GroundWireType,
  GroundWireVersionEntity,
  GroundWiresRepository,
  CivilDate,
  EffectivePeriod,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  CatalogItemNotFoundException,
  NoEffectiveVersionFoundException,
} from '../../../domain';

export interface CreateGroundWireInput {
  code: string;
  type: GroundWireType;
  description?: string | null;
  weightTonPerKm?: string | null;
  reelLengthM?: string | null;
  diameterMm?: string | null;
  utsKn?: string | null;
  galvanizationClass?: string | null;
  strengthGrade?: string | null;
  wireCount?: number | null;
  manufacturer?: string | null;
  i2tKa2s?: string | null;
  fiberCount?: number | null;
  effectiveFrom?: string | null;
}

export interface CreateGroundWireVersionInput {
  description?: string | null;
  weightTonPerKm?: string | null;
  reelLengthM?: string | null;
  diameterMm?: string | null;
  utsKn?: string | null;
  galvanizationClass?: string | null;
  strengthGrade?: string | null;
  wireCount?: number | null;
  manufacturer?: string | null;
  i2tKa2s?: string | null;
  fiberCount?: number | null;
  effectiveFrom: string;
}

export class GroundWiresUseCases {
  constructor(private readonly repository: GroundWiresRepository) {}

  async create(
    input: CreateGroundWireInput,
    createdBy: string,
    today: CivilDate = CivilDate.today(),
  ): Promise<GroundWireEntity> {
    const existing = await this.repository.findByCode(input.code);
    if (existing) {
      throw new DuplicateCatalogCodeException(input.code);
    }

    const effectiveFrom = input.effectiveFrom
      ? CivilDate.fromString(input.effectiveFrom)
      : today;

    const version = new GroundWireVersionEntity({
      description: input.description,
      weightTonPerKm: input.weightTonPerKm,
      reelLengthM: input.reelLengthM,
      diameterMm: input.diameterMm,
      utsKn: input.utsKn,
      galvanizationClass: input.galvanizationClass,
      strengthGrade: input.strengthGrade,
      wireCount: input.wireCount,
      manufacturer: input.manufacturer,
      i2tKa2s: input.i2tKa2s,
      fiberCount: input.fiberCount,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    version.validateTypeApplicability(input.type);

    const entity = new GroundWireEntity({
      id: 0,
      code: input.code,
      type: input.type,
      versions: [version],
    });

    return this.repository.save(entity);
  }

  async list(
    search?: string,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<GroundWireEntity[]> {
    return this.repository.list({ search });
  }

  async get(
    id: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<{
    entity: GroundWireEntity;
    effectiveVersion: GroundWireVersionEntity;
  }> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Cabo de guarda', id);
    }

    const effective = item.getEffectiveVersion(referenceDate);
    if (!effective) {
      throw new NoEffectiveVersionFoundException('Cabo de guarda');
    }

    return { entity: item, effectiveVersion: effective };
  }

  async listHistory(id: number): Promise<GroundWireEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Cabo de guarda', id);
    }
    return item;
  }

  async createVersion(
    id: number,
    input: CreateGroundWireVersionInput,
    createdBy: string,
  ): Promise<GroundWireVersionEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Cabo de guarda', id);
    }

    const effectiveFrom = CivilDate.fromString(input.effectiveFrom);
    const dateAlreadyUsed = item.versions.some((v) =>
      v.effectivePeriod.effectiveFrom.equals(effectiveFrom),
    );
    if (dateAlreadyUsed) {
      throw new DuplicateVersionDateException();
    }

    const version = new GroundWireVersionEntity({
      groundWireId: id,
      description: input.description,
      weightTonPerKm: input.weightTonPerKm,
      reelLengthM: input.reelLengthM,
      diameterMm: input.diameterMm,
      utsKn: input.utsKn,
      galvanizationClass: input.galvanizationClass,
      strengthGrade: input.strengthGrade,
      wireCount: input.wireCount,
      manufacturer: input.manufacturer,
      i2tKa2s: input.i2tKa2s,
      fiberCount: input.fiberCount,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    version.validateTypeApplicability(item.type);

    return this.repository.createVersion(id, version);
  }
}
