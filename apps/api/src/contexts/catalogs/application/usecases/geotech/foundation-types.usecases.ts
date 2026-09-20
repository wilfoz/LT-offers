import {
  FoundationApplication,
  FoundationElementCounts,
  FoundationTypeEntity,
  FoundationTypeVersionEntity,
  FoundationTypesRepository,
  CivilDate,
  EffectivePeriod,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  CatalogItemNotFoundException,
  NoEffectiveVersionFoundException,
} from '../../../domain';

export type CreateFoundationTypeInput = Partial<FoundationElementCounts> & {
  code: string;
  application: FoundationApplication;
  description?: string | null;
  effectiveFrom?: string | null;
};

export type CreateFoundationTypeVersionInput =
  Partial<FoundationElementCounts> & {
    description?: string | null;
    effectiveFrom: string;
  };

export class FoundationTypesUseCases {
  constructor(private readonly repository: FoundationTypesRepository) {}

  async create(
    input: CreateFoundationTypeInput,
    createdBy: string,
    today: CivilDate = CivilDate.today(),
  ): Promise<FoundationTypeEntity> {
    const existing = await this.repository.findByCode(input.code);
    if (existing) {
      throw new DuplicateCatalogCodeException(input.code);
    }

    const effectiveFrom = input.effectiveFrom
      ? CivilDate.fromString(input.effectiveFrom)
      : today;

    const version = new FoundationTypeVersionEntity({
      description: input.description,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
      spreadFootingCount: input.spreadFootingCount,
      precastMastCount: input.precastMastCount,
      precastGuyCount: input.precastGuyCount,
      straightPierCount: input.straightPierCount,
      belledPierCount: input.belledPierCount,
      slabPierCount: input.slabPierCount,
      straightPierGuyCount: input.straightPierGuyCount,
      belledPierGuyCount: input.belledPierGuyCount,
      rockAnchorCount: input.rockAnchorCount,
      concretePileCount: input.concretePileCount,
      steelPileCount: input.steelPileCount,
      helicalMastCount: input.helicalMastCount,
      helicalGuyCount: input.helicalGuyCount,
      triconeCount: input.triconeCount,
      rootPileCount: input.rootPileCount,
      micropileCount: input.micropileCount,
      continuousAugerPileCount: input.continuousAugerPileCount,
    });

    const entity = new FoundationTypeEntity({
      id: 0,
      code: input.code,
      application: input.application,
      versions: [version],
    });

    return this.repository.save(entity);
  }

  async list(
    search?: string,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<FoundationTypeEntity[]> {
    return this.repository.list({ search });
  }

  async get(
    id: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<{
    entity: FoundationTypeEntity;
    effectiveVersion: FoundationTypeVersionEntity;
  }> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Tipo de fundação', id);
    }

    const effective = item.getEffectiveVersion(referenceDate);
    if (!effective) {
      throw new NoEffectiveVersionFoundException('Tipo de fundação');
    }

    return { entity: item, effectiveVersion: effective };
  }

  async listHistory(id: number): Promise<FoundationTypeEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Tipo de fundação', id);
    }
    return item;
  }

  async createVersion(
    id: number,
    input: CreateFoundationTypeVersionInput,
    createdBy: string,
  ): Promise<FoundationTypeVersionEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Tipo de fundação', id);
    }

    const effectiveFrom = CivilDate.fromString(input.effectiveFrom);
    const dateAlreadyUsed = item.versions.some((v) =>
      v.effectivePeriod.effectiveFrom.equals(effectiveFrom),
    );
    if (dateAlreadyUsed) {
      throw new DuplicateVersionDateException();
    }

    const version = new FoundationTypeVersionEntity({
      foundationTypeId: id,
      description: input.description,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
      spreadFootingCount: input.spreadFootingCount,
      precastMastCount: input.precastMastCount,
      precastGuyCount: input.precastGuyCount,
      straightPierCount: input.straightPierCount,
      belledPierCount: input.belledPierCount,
      slabPierCount: input.slabPierCount,
      straightPierGuyCount: input.straightPierGuyCount,
      belledPierGuyCount: input.belledPierGuyCount,
      rockAnchorCount: input.rockAnchorCount,
      concretePileCount: input.concretePileCount,
      steelPileCount: input.steelPileCount,
      helicalMastCount: input.helicalMastCount,
      helicalGuyCount: input.helicalGuyCount,
      triconeCount: input.triconeCount,
      rootPileCount: input.rootPileCount,
      micropileCount: input.micropileCount,
      continuousAugerPileCount: input.continuousAugerPileCount,
    });

    return this.repository.createVersion(id, version);
  }
}
