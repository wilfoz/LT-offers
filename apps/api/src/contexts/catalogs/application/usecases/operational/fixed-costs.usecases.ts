import {
  FixedCostCategory,
  FixedCostEntity,
  FixedCostVersionEntity,
  FixedCostsRepository,
  CivilDate,
  EffectivePeriod,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  CatalogItemNotFoundException,
  NoEffectiveVersionFoundException,
} from '../../../domain';

export interface CreateFixedCostInput {
  code: string;
  description: string;
  category: FixedCostCategory;
  unitCost?: string | null;
  unit?: string | null;
  effectiveFrom?: string | null;
}

export interface CreateFixedCostVersionInput {
  unitCost?: string | null;
  unit?: string | null;
  effectiveFrom: string;
}

export class FixedCostsUseCases {
  constructor(private readonly repository: FixedCostsRepository) {}

  async create(
    input: CreateFixedCostInput,
    createdBy: string,
    today: CivilDate = CivilDate.today(),
  ): Promise<FixedCostEntity> {
    const existing = await this.repository.findByCode(input.code);
    if (existing) {
      throw new DuplicateCatalogCodeException(input.code);
    }

    const effectiveFrom = input.effectiveFrom
      ? CivilDate.fromString(input.effectiveFrom)
      : today;

    const version = new FixedCostVersionEntity({
      unitCost: input.unitCost,
      unit: input.unit,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    const entity = new FixedCostEntity({
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
  ): Promise<FixedCostEntity[]> {
    return this.repository.list({ search });
  }

  async get(
    id: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<{
    entity: FixedCostEntity;
    effectiveVersion: FixedCostVersionEntity;
  }> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Custo fixo', id);
    }

    const effective = item.getEffectiveVersion(referenceDate);
    if (!effective) {
      throw new NoEffectiveVersionFoundException('Custo fixo');
    }

    return { entity: item, effectiveVersion: effective };
  }

  async listHistory(id: number): Promise<FixedCostEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Custo fixo', id);
    }
    return item;
  }

  async createVersion(
    id: number,
    input: CreateFixedCostVersionInput,
    createdBy: string,
  ): Promise<FixedCostVersionEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Custo fixo', id);
    }

    const effectiveFrom = CivilDate.fromString(input.effectiveFrom);
    const dateAlreadyUsed = item.versions.some((v) =>
      v.effectivePeriod.effectiveFrom.equals(effectiveFrom),
    );
    if (dateAlreadyUsed) {
      throw new DuplicateVersionDateException();
    }

    const version = new FixedCostVersionEntity({
      fixedCostId: id,
      unitCost: input.unitCost,
      unit: input.unit,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    return this.repository.createVersion(id, version);
  }
}
