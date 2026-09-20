import {
  StructureSeriesEntity,
  StructureSeriesVersionEntity,
  StructureSeriesRepository,
  CivilDate,
  EffectivePeriod,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  CatalogItemNotFoundException,
  NoEffectiveVersionFoundException,
} from '../../../domain';

export interface CreateStructureSeriesInput {
  name: string;
  designer?: string | null;
  voltageKv?: string | null;
  circuitCount?: number | null;
  cablesPerPhase?: number | null;
  designWindSpeedMs?: string | null;
  insulatorType?: string | null;
  silMw?: string | null;
  effectiveFrom?: string | null;
}

export interface CreateStructureSeriesVersionInput {
  designer?: string | null;
  voltageKv?: string | null;
  circuitCount?: number | null;
  cablesPerPhase?: number | null;
  designWindSpeedMs?: string | null;
  insulatorType?: string | null;
  silMw?: string | null;
  effectiveFrom: string;
}

export class StructureSeriesUseCases {
  constructor(private readonly repository: StructureSeriesRepository) {}

  async create(
    input: CreateStructureSeriesInput,
    createdBy: string,
    today: CivilDate = CivilDate.today(),
  ): Promise<StructureSeriesEntity> {
    const existing = await this.repository.findByName(input.name);
    if (existing) {
      throw new DuplicateCatalogCodeException(input.name);
    }

    const effectiveFrom = input.effectiveFrom
      ? CivilDate.fromString(input.effectiveFrom)
      : today;

    const version = new StructureSeriesVersionEntity({
      designer: input.designer,
      voltageKv: input.voltageKv,
      circuitCount: input.circuitCount,
      cablesPerPhase: input.cablesPerPhase,
      designWindSpeedMs: input.designWindSpeedMs,
      insulatorType: input.insulatorType,
      silMw: input.silMw,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    const entity = new StructureSeriesEntity({
      id: 0,
      name: input.name,
      versions: [version],
    });

    return this.repository.save(entity);
  }

  async list(
    search?: string,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<StructureSeriesEntity[]> {
    return this.repository.list({ search });
  }

  async get(
    id: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<{
    entity: StructureSeriesEntity;
    effectiveVersion: StructureSeriesVersionEntity;
  }> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Série de estruturas', id);
    }

    const effective = item.getEffectiveVersion(referenceDate);
    if (!effective) {
      throw new NoEffectiveVersionFoundException('Série de estruturas');
    }

    return { entity: item, effectiveVersion: effective };
  }

  async listHistory(id: number): Promise<StructureSeriesEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Série de estruturas', id);
    }
    return item;
  }

  async createVersion(
    id: number,
    input: CreateStructureSeriesVersionInput,
    createdBy: string,
  ): Promise<StructureSeriesVersionEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Série de estruturas', id);
    }

    const effectiveFrom = CivilDate.fromString(input.effectiveFrom);
    const dateAlreadyUsed = item.versions.some((v) =>
      v.effectivePeriod.effectiveFrom.equals(effectiveFrom),
    );
    if (dateAlreadyUsed) {
      throw new DuplicateVersionDateException();
    }

    const version = new StructureSeriesVersionEntity({
      structureSeriesId: id,
      designer: input.designer,
      voltageKv: input.voltageKv,
      circuitCount: input.circuitCount,
      cablesPerPhase: input.cablesPerPhase,
      designWindSpeedMs: input.designWindSpeedMs,
      insulatorType: input.insulatorType,
      silMw: input.silMw,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    return this.repository.createVersion(id, version);
  }
}
