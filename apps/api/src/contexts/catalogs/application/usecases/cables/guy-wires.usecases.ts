import {
  GuyWireEntity,
  GuyWireVersionEntity,
  GuyWiresRepository,
  CivilDate,
  EffectivePeriod,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  CatalogItemNotFoundException,
  NoEffectiveVersionFoundException,
} from '../../../domain';

export interface CreateGuyWireInput {
  code: string;
  description?: string | null;
  weightTonPerKm?: string | null;
  reelLengthM?: string | null;
  diameterMm?: string | null;
  utsKn?: string | null;
  galvanizationClass?: string | null;
  strengthGrade?: string | null;
  wireCount?: number | null;
  effectiveFrom?: string | null;
}

export interface CreateGuyWireVersionInput {
  description?: string | null;
  weightTonPerKm?: string | null;
  reelLengthM?: string | null;
  diameterMm?: string | null;
  utsKn?: string | null;
  galvanizationClass?: string | null;
  strengthGrade?: string | null;
  wireCount?: number | null;
  effectiveFrom: string;
}

export class GuyWiresUseCases {
  constructor(private readonly repository: GuyWiresRepository) {}

  async create(
    input: CreateGuyWireInput,
    createdBy: string,
    today: CivilDate = CivilDate.today(),
  ): Promise<GuyWireEntity> {
    const existing = await this.repository.findByCode(input.code);
    if (existing) {
      throw new DuplicateCatalogCodeException(input.code);
    }

    const effectiveFrom = input.effectiveFrom
      ? CivilDate.fromString(input.effectiveFrom)
      : today;

    const version = new GuyWireVersionEntity({
      description: input.description,
      weightTonPerKm: input.weightTonPerKm,
      reelLengthM: input.reelLengthM,
      diameterMm: input.diameterMm,
      utsKn: input.utsKn,
      galvanizationClass: input.galvanizationClass,
      strengthGrade: input.strengthGrade,
      wireCount: input.wireCount,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    const entity = new GuyWireEntity({
      id: 0,
      code: input.code,
      versions: [version],
    });

    return this.repository.save(entity);
  }

  async list(
    search?: string,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<GuyWireEntity[]> {
    return this.repository.list({ search });
  }

  async get(
    id: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<{
    entity: GuyWireEntity;
    effectiveVersion: GuyWireVersionEntity;
  }> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Cabo de tirante', id);
    }

    const effective = item.getEffectiveVersion(referenceDate);
    if (!effective) {
      throw new NoEffectiveVersionFoundException('Cabo de tirante');
    }

    return { entity: item, effectiveVersion: effective };
  }

  async listHistory(id: number): Promise<GuyWireEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Cabo de tirante', id);
    }
    return item;
  }

  async createVersion(
    id: number,
    input: CreateGuyWireVersionInput,
    createdBy: string,
  ): Promise<GuyWireVersionEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Cabo de tirante', id);
    }

    const effectiveFrom = CivilDate.fromString(input.effectiveFrom);
    const dateAlreadyUsed = item.versions.some((v) =>
      v.effectivePeriod.effectiveFrom.equals(effectiveFrom),
    );
    if (dateAlreadyUsed) {
      throw new DuplicateVersionDateException();
    }

    const version = new GuyWireVersionEntity({
      guyWireId: id,
      description: input.description,
      weightTonPerKm: input.weightTonPerKm,
      reelLengthM: input.reelLengthM,
      diameterMm: input.diameterMm,
      utsKn: input.utsKn,
      galvanizationClass: input.galvanizationClass,
      strengthGrade: input.strengthGrade,
      wireCount: input.wireCount,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    return this.repository.createVersion(id, version);
  }
}
