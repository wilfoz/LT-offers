import {
  TowerFunction,
  TowerTypeEntity,
  TowerTypeVersionEntity,
  TowerTypeWeightItem,
  TowerTypesRepository,
  StructureSeriesRepository,
  CivilDate,
  EffectivePeriod,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  CatalogItemNotFoundException,
  NoEffectiveVersionFoundException,
} from '../../../domain';

export interface CreateTowerTypeInput {
  code: string;
  function: TowerFunction;
  guyCount?: number | null;
  weights?: TowerTypeWeightItem[];
  effectiveFrom?: string | null;
}

export interface CreateTowerTypeVersionInput {
  guyCount?: number | null;
  weights?: TowerTypeWeightItem[];
  effectiveFrom: string;
}

export class TowerTypesUseCases {
  constructor(
    private readonly repository: TowerTypesRepository,
    private readonly seriesRepository: StructureSeriesRepository,
  ) {}

  private async assertSeriesExists(seriesId: number): Promise<void> {
    const series = await this.seriesRepository.findById(seriesId);
    if (!series) {
      throw new CatalogItemNotFoundException('Série de estruturas', seriesId);
    }
  }

  async create(
    seriesId: number,
    input: CreateTowerTypeInput,
    createdBy: string,
    today: CivilDate = CivilDate.today(),
  ): Promise<TowerTypeEntity> {
    await this.assertSeriesExists(seriesId);

    const existing = await this.repository.findBySeriesAndCode(
      seriesId,
      input.code,
    );
    if (existing) {
      throw new DuplicateCatalogCodeException(input.code);
    }

    const effectiveFrom = input.effectiveFrom
      ? CivilDate.fromString(input.effectiveFrom)
      : today;

    const version = new TowerTypeVersionEntity({
      guyCount: input.guyCount,
      weights: input.weights ?? [],
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    const entity = new TowerTypeEntity({
      id: 0,
      structureSeriesId: seriesId,
      code: input.code,
      function: input.function,
      versions: [version],
    });

    return this.repository.save(entity);
  }

  async listBySeries(
    seriesId: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<TowerTypeEntity[]> {
    await this.assertSeriesExists(seriesId);
    return this.repository.listBySeries(seriesId);
  }

  async get(
    seriesId: number,
    id: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<{
    entity: TowerTypeEntity;
    effectiveVersion: TowerTypeVersionEntity;
  }> {
    await this.assertSeriesExists(seriesId);

    const item = await this.repository.findById(id);
    if (!item || item.structureSeriesId !== seriesId) {
      throw new CatalogItemNotFoundException('Tipo de torre', id);
    }

    const effective = item.getEffectiveVersion(referenceDate);
    if (!effective) {
      throw new NoEffectiveVersionFoundException('Tipo de torre');
    }

    return { entity: item, effectiveVersion: effective };
  }

  async listHistory(seriesId: number, id: number): Promise<TowerTypeEntity> {
    await this.assertSeriesExists(seriesId);

    const item = await this.repository.findById(id);
    if (!item || item.structureSeriesId !== seriesId) {
      throw new CatalogItemNotFoundException('Tipo de torre', id);
    }
    return item;
  }

  async createVersion(
    seriesId: number,
    id: number,
    input: CreateTowerTypeVersionInput,
    createdBy: string,
  ): Promise<TowerTypeVersionEntity> {
    await this.assertSeriesExists(seriesId);

    const item = await this.repository.findById(id);
    if (!item || item.structureSeriesId !== seriesId) {
      throw new CatalogItemNotFoundException('Tipo de torre', id);
    }

    const effectiveFrom = CivilDate.fromString(input.effectiveFrom);
    const dateAlreadyUsed = item.versions.some((v) =>
      v.effectivePeriod.effectiveFrom.equals(effectiveFrom),
    );
    if (dateAlreadyUsed) {
      throw new DuplicateVersionDateException();
    }

    const version = new TowerTypeVersionEntity({
      towerTypeId: id,
      guyCount: input.guyCount,
      weights: input.weights ?? [],
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    return this.repository.createVersion(id, version);
  }
}
