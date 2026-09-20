import {
  FoundationVolumeQuantities,
  FoundationVolumeEntity,
  FoundationVolumeVersionEntity,
  FoundationVolumesRepository,
  FoundationVolumesFilter,
  TowerTypesRepository,
  SoilTypesRepository,
  FoundationTypesRepository,
  CivilDate,
  EffectivePeriod,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  CatalogItemNotFoundException,
  NoEffectiveVersionFoundException,
} from '../../../domain';

export type CreateFoundationVolumeInput =
  Partial<FoundationVolumeQuantities> & {
    towerTypeId: number;
    soilTypeId: number;
    foundationTypeId: number;
    effectiveFrom?: string | null;
  };

export type CreateFoundationVolumeVersionInput =
  Partial<FoundationVolumeQuantities> & {
    effectiveFrom: string;
  };

export class FoundationVolumesUseCases {
  constructor(
    private readonly repository: FoundationVolumesRepository,
    private readonly towerTypesRepository: TowerTypesRepository,
    private readonly soilTypesRepository: SoilTypesRepository,
    private readonly foundationTypesRepository: FoundationTypesRepository,
  ) {}

  private async assertReferencesExist(input: {
    towerTypeId: number;
    soilTypeId: number;
    foundationTypeId: number;
  }): Promise<void> {
    const towerType = await this.towerTypesRepository.findById(
      input.towerTypeId,
    );
    if (!towerType) {
      throw new CatalogItemNotFoundException(
        'Tipo de torre',
        input.towerTypeId,
      );
    }

    const soilType = await this.soilTypesRepository.findById(input.soilTypeId);
    if (!soilType) {
      throw new CatalogItemNotFoundException('Tipo de solo', input.soilTypeId);
    }

    const foundationType = await this.foundationTypesRepository.findById(
      input.foundationTypeId,
    );
    if (!foundationType) {
      throw new CatalogItemNotFoundException(
        'Tipo de fundação',
        input.foundationTypeId,
      );
    }
  }

  async create(
    input: CreateFoundationVolumeInput,
    createdBy: string,
    today: CivilDate = CivilDate.today(),
  ): Promise<FoundationVolumeEntity> {
    await this.assertReferencesExist(input);

    const existing = await this.repository.findByCombination(
      input.towerTypeId,
      input.soilTypeId,
      input.foundationTypeId,
    );
    if (existing) {
      throw new DuplicateCatalogCodeException(
        `Já existe uma entrada para a combinação torre=${input.towerTypeId}, solo=${input.soilTypeId}, fundação=${input.foundationTypeId}`,
      );
    }

    const effectiveFrom = input.effectiveFrom
      ? CivilDate.fromString(input.effectiveFrom)
      : today;

    const version = new FoundationVolumeVersionEntity({
      ...input,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    const entity = new FoundationVolumeEntity({
      id: 0,
      towerTypeId: input.towerTypeId,
      soilTypeId: input.soilTypeId,
      foundationTypeId: input.foundationTypeId,
      versions: [version],
    });

    return this.repository.save(entity);
  }

  async list(
    filter?: FoundationVolumesFilter,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<FoundationVolumeEntity[]> {
    return this.repository.list(filter);
  }

  async get(
    id: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<{
    entity: FoundationVolumeEntity;
    effectiveVersion: FoundationVolumeVersionEntity;
  }> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException(
        'Entrada da matriz de volumes',
        id,
      );
    }

    const effective = item.getEffectiveVersion(referenceDate);
    if (!effective) {
      throw new NoEffectiveVersionFoundException(
        'Entrada da matriz de volumes',
      );
    }

    return { entity: item, effectiveVersion: effective };
  }

  async listHistory(id: number): Promise<FoundationVolumeEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException(
        'Entrada da matriz de volumes',
        id,
      );
    }
    return item;
  }

  async createVersion(
    id: number,
    input: CreateFoundationVolumeVersionInput,
    createdBy: string,
  ): Promise<FoundationVolumeVersionEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException(
        'Entrada da matriz de volumes',
        id,
      );
    }

    const effectiveFrom = CivilDate.fromString(input.effectiveFrom);
    const dateAlreadyUsed = item.versions.some((v) =>
      v.effectivePeriod.effectiveFrom.equals(effectiveFrom),
    );
    if (dateAlreadyUsed) {
      throw new DuplicateVersionDateException();
    }

    const version = new FoundationVolumeVersionEntity({
      foundationVolumeId: id,
      ...input,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    return this.repository.createVersion(id, version);
  }
}
