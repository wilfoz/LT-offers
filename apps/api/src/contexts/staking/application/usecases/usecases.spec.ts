import { StakingPaginationQuery } from '@lt-offers/domain';
import {
  StakingTower,
  PreliminaryStakingDistribution,
  Station,
  DeflectionAngle,
  CoordinatesUtm,
  PreliminaryPercentages,
  StakingTowersRepository,
  PreliminaryDistributionRepository,
  StakingCatalogQueryPort,
  StakingUnitOfWork,
  StakingBatchFilter,
  StakingBatchUpdateData,
  PaginatedStakingTowersResult,
  TransmissionLineInfo,
  StakingTowerNotFoundException,
  DuplicateTowerNumberException,
  InvalidStakingDistributionException,
} from '../../domain';
import {
  GetPaginatedStakingTowersUseCase,
  GetStakingTowerByIdUseCase,
  CreateStakingTowerUseCase,
  UpdateStakingTowerUseCase,
  DeleteStakingTowerUseCase,
  BatchAssignStakingUseCase,
  ValidateStakingIntegrityUseCase,
  GetPreliminaryDistributionUseCase,
  SavePreliminaryDistributionUseCase,
  CommitPlsCaddImportUseCase,
} from './';

class InMemoryStakingTowersRepository implements StakingTowersRepository {
  public towers: StakingTower[] = [];
  private nextId = 1;

  async findById(id: number): Promise<StakingTower | null> {
    return this.towers.find((t) => t.id === id) || null;
  }

  async findByTowerNumber(
    lineId: number,
    towerNumber: string,
  ): Promise<StakingTower | null> {
    return (
      this.towers.find(
        (t) =>
          t.transmissionLineId === lineId &&
          t.towerNumber.toUpperCase() === towerNumber.toUpperCase(),
      ) || null
    );
  }

  async findManyByLineId(lineId: number): Promise<StakingTower[]> {
    return this.towers
      .filter((t) => t.transmissionLineId === lineId)
      .sort((a, b) => a.station.meters - b.station.meters);
  }

  async findPaginated(
    lineId: number,
    query: StakingPaginationQuery,
  ): Promise<PaginatedStakingTowersResult> {
    let filtered = this.towers.filter((t) => t.transmissionLineId === lineId);

    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter((t) =>
        t.towerNumber.toLowerCase().includes(s),
      );
    }

    filtered.sort((a, b) => a.station.meters - b.station.meters);

    let minStation = 0;
    let maxStation = 0;
    let unassignedSoilCount = 0;
    let unassignedFoundationCount = 0;

    if (filtered.length > 0) {
      minStation = filtered[0].station.meters;
      maxStation = filtered[0].station.meters;

      for (const t of filtered) {
        if (t.station.meters < minStation) minStation = t.station.meters;
        if (t.station.meters > maxStation) maxStation = t.station.meters;
        if (t.soilTypeId === null) unassignedSoilCount++;
        if (t.foundationTypeId === null) unassignedFoundationCount++;
      }
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;

    return {
      items,
      totalCount: filtered.length,
      page,
      pageSize,
      totalPages,
      summary: {
        totalTowers: filtered.length,
        minStationMeters: minStation.toFixed(2),
        maxStationMeters: maxStation.toFixed(2),
        unassignedSoilCount,
        unassignedFoundationCount,
        invalidCombinationsCount: 0,
      },
    };
  }

  async save(tower: StakingTower): Promise<StakingTower> {
    const id = tower.id ?? this.nextId++;
    const saved = new StakingTower({
      id,
      transmissionLineId: tower.transmissionLineId,
      towerNumber: tower.towerNumber,
      station: tower.station,
      bodyExtensionMeters: tower.bodyExtensionMeters,
      deflectionAngle: tower.deflectionAngle,
      lateralOffsetMeters: tower.lateralOffsetMeters,
      coordinates: tower.coordinates,
      towerTypeId: tower.towerTypeId,
      soilTypeId: tower.soilTypeId,
      foundationTypeId: tower.foundationTypeId,
      accessDifficulty: tower.accessDifficulty,
      notes: tower.notes,
      towerType: tower.towerType,
      soilType: tower.soilType,
      foundationType: tower.foundationType,
    });
    this.towers.push(saved);
    return saved;
  }

  async update(id: number, tower: StakingTower): Promise<StakingTower> {
    const idx = this.towers.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.towers[idx] = tower;
    }
    return tower;
  }

  async delete(id: number): Promise<void> {
    this.towers = this.towers.filter((t) => t.id !== id);
  }

  async batchUpdate(
    lineId: number,
    filter: StakingBatchFilter,
    updateData: StakingBatchUpdateData,
  ): Promise<number> {
    let count = 0;
    for (const t of this.towers) {
      if (t.transmissionLineId !== lineId) continue;
      if (filter.towerIds && !filter.towerIds.includes(t.id!)) continue;
      if (
        filter.startStationMeters !== undefined &&
        t.station.meters < filter.startStationMeters
      )
        continue;
      if (
        filter.endStationMeters !== undefined &&
        t.station.meters > filter.endStationMeters
      )
        continue;
      if (
        filter.towerTypeIdFilter !== undefined &&
        t.towerTypeId !== filter.towerTypeIdFilter
      )
        continue;
      if (
        filter.soilTypeIdFilter !== undefined &&
        t.soilTypeId !== filter.soilTypeIdFilter
      )
        continue;

      t.update({
        towerTypeId:
          updateData.towerTypeId !== undefined
            ? updateData.towerTypeId
            : t.towerTypeId,
        soilTypeId:
          updateData.soilTypeId !== undefined
            ? updateData.soilTypeId
            : t.soilTypeId,
        foundationTypeId:
          updateData.foundationTypeId !== undefined
            ? updateData.foundationTypeId
            : t.foundationTypeId,
        accessDifficulty:
          updateData.accessDifficulty !== undefined
            ? updateData.accessDifficulty
            : t.accessDifficulty,
        notes: updateData.notes !== undefined ? updateData.notes : t.notes,
      });
      count++;
    }
    return count;
  }

  async deleteManyByIds(ids: number[]): Promise<number> {
    const initialLen = this.towers.length;
    this.towers = this.towers.filter((t) => !ids.includes(t.id!));
    return initialLen - this.towers.length;
  }
}

class InMemoryPreliminaryDistributionRepository implements PreliminaryDistributionRepository {
  public distributions: PreliminaryStakingDistribution[] = [];
  private nextId = 1;

  async findByLineId(
    lineId: number,
  ): Promise<PreliminaryStakingDistribution | null> {
    return (
      this.distributions.find((d) => d.transmissionLineId === lineId) || null
    );
  }

  async save(
    distribution: PreliminaryStakingDistribution,
  ): Promise<PreliminaryStakingDistribution> {
    const idx = this.distributions.findIndex(
      (d) => d.transmissionLineId === distribution.transmissionLineId,
    );
    if (idx >= 0) {
      this.distributions[idx] = distribution;
      return distribution;
    }
    const id = distribution.id ?? this.nextId++;
    const saved = new PreliminaryStakingDistribution({
      id,
      transmissionLineId: distribution.transmissionLineId,
      soilPercentages: distribution.soilPercentages,
      foundationPercentages: distribution.foundationPercentages,
    });
    this.distributions.push(saved);
    return saved;
  }
}

class InMemoryStakingCatalogQueryPort implements StakingCatalogQueryPort {
  public validLines = new Map<number, TransmissionLineInfo>([
    [10, { id: 10, refinedLengthKm: '50.000' }],
    [20, { id: 20, refinedLengthKm: '100.000' }],
  ]);

  public towerTypeMap = new Map<string, number>([
    ['T1', 1],
    ['T2', 2],
  ]);
  public soilTypeMap = new Map<string, number>([
    ['S1', 10],
    ['S2', 20],
  ]);
  public foundationTypeMap = new Map<string, number>([
    ['F1', 100],
    ['F2', 200],
  ]);
  public validCombinations = new Set<string>(['10:100', '20:200']);

  async ensureTransmissionLineExists(
    lineId: number,
  ): Promise<TransmissionLineInfo> {
    const line = this.validLines.get(lineId);
    if (!line) {
      throw new Error(`Linha de transmissão #${lineId} não encontrada.`);
    }
    return line;
  }

  async findCatalogCodes(): Promise<{
    towerTypeMap: Map<string, number>;
    soilTypeMap: Map<string, number>;
    foundationTypeMap: Map<string, number>;
  }> {
    return {
      towerTypeMap: this.towerTypeMap,
      soilTypeMap: this.soilTypeMap,
      foundationTypeMap: this.foundationTypeMap,
    };
  }

  async findValidFoundationVolumeCombinations(): Promise<Set<string>> {
    return this.validCombinations;
  }
}

class InMemoryStakingUnitOfWork implements StakingUnitOfWork {
  constructor(private readonly towersRepo: StakingTowersRepository) {}

  async execute<T>(
    fn: (repos: { stakingTowers: StakingTowersRepository }) => Promise<T>,
  ): Promise<T> {
    return fn({ stakingTowers: this.towersRepo });
  }
}

describe('Staking Use Cases (Hexagonal Architecture)', () => {
  let towersRepo: InMemoryStakingTowersRepository;
  let distRepo: InMemoryPreliminaryDistributionRepository;
  let catalogQuery: InMemoryStakingCatalogQueryPort;
  let unitOfWork: InMemoryStakingUnitOfWork;

  beforeEach(() => {
    towersRepo = new InMemoryStakingTowersRepository();
    distRepo = new InMemoryPreliminaryDistributionRepository();
    catalogQuery = new InMemoryStakingCatalogQueryPort();
    unitOfWork = new InMemoryStakingUnitOfWork(towersRepo);
  });

  it('1. deve criar e consultar torres com paginação correta', async () => {
    const createUseCase = new CreateStakingTowerUseCase(
      towersRepo,
      catalogQuery,
    );
    const getPaginatedUseCase = new GetPaginatedStakingTowersUseCase(
      towersRepo,
      catalogQuery,
    );

    await createUseCase.execute(10, {
      towerNumber: 'T-01',
      stationMeters: '0',
      bodyExtensionMeters: '3.0',
      deflectionAngleDeg: '0',
      lateralOffsetMeters: '0',
      utmEast: '500000',
      utmNorth: '7000000',
      elevationMeters: '650',
      towerTypeId: 1,
      soilTypeId: 10,
      foundationTypeId: 100,
    });

    await createUseCase.execute(10, {
      towerNumber: 'T-02',
      stationMeters: '450',
      bodyExtensionMeters: '0',
      deflectionAngleDeg: '12.5',
      lateralOffsetMeters: '0',
      towerTypeId: 2,
    });

    const paginated = await getPaginatedUseCase.execute(10, {
      page: 1,
      pageSize: 10,
    });
    expect(paginated.totalCount).toBe(2);
    expect(paginated.items[0].towerNumber).toBe('T-01');
    expect(paginated.items[1].towerNumber).toBe('T-02');
    expect(paginated.summary.maxStationMeters).toBe('450.00');
  });

  it('2. deve rejeitar criação de torre com identificador duplicado na mesma linha', async () => {
    const createUseCase = new CreateStakingTowerUseCase(
      towersRepo,
      catalogQuery,
    );

    await createUseCase.execute(10, {
      towerNumber: 'T-DUP',
      stationMeters: '100',
    });

    await expect(
      createUseCase.execute(10, {
        towerNumber: 'T-DUP',
        stationMeters: '200',
      }),
    ).rejects.toThrow(DuplicateTowerNumberException);
  });

  it('3. deve atualizar dados de uma torre existente', async () => {
    const createUseCase = new CreateStakingTowerUseCase(
      towersRepo,
      catalogQuery,
    );
    const updateUseCase = new UpdateStakingTowerUseCase(towersRepo);
    const getByIdUseCase = new GetStakingTowerByIdUseCase(towersRepo);

    const created = await createUseCase.execute(10, {
      towerNumber: 'T-100',
      stationMeters: '1000',
    });

    await updateUseCase.execute(10, created.id!, {
      bodyExtensionMeters: '6.0',
      accessDifficulty: 'DIFFICULT',
      notes: 'Acesso por trilha',
    });

    const updated = await getByIdUseCase.execute(10, created.id!);
    expect(updated.bodyExtensionMeters).toBe(6);
    expect(updated.accessDifficulty).toBe('DIFFICULT');
    expect(updated.notes).toBe('Acesso por trilha');
  });

  it('4. deve excluir torre e lançar exceção em buscas subsequentes', async () => {
    const createUseCase = new CreateStakingTowerUseCase(
      towersRepo,
      catalogQuery,
    );
    const deleteUseCase = new DeleteStakingTowerUseCase(towersRepo);
    const getByIdUseCase = new GetStakingTowerByIdUseCase(towersRepo);

    const created = await createUseCase.execute(10, {
      towerNumber: 'T-DEL',
      stationMeters: '500',
    });

    await deleteUseCase.execute(10, created.id!);

    await expect(getByIdUseCase.execute(10, created.id!)).rejects.toThrow(
      StakingTowerNotFoundException,
    );
  });

  it('5. deve executar atribuição em lote (Batch Assign) por intervalo de estacas', async () => {
    const createUseCase = new CreateStakingTowerUseCase(
      towersRepo,
      catalogQuery,
    );
    const batchAssignUseCase = new BatchAssignStakingUseCase(
      towersRepo,
      catalogQuery,
    );

    await createUseCase.execute(10, {
      towerNumber: 'T-01',
      stationMeters: '100',
    });
    await createUseCase.execute(10, {
      towerNumber: 'T-02',
      stationMeters: '500',
    });
    await createUseCase.execute(10, {
      towerNumber: 'T-03',
      stationMeters: '900',
    });

    const result = await batchAssignUseCase.execute(10, {
      startStationMeters: 200,
      endStationMeters: 600,
      assignSoilTypeId: 10,
      assignFoundationTypeId: 100,
    });

    expect(result.updatedCount).toBe(1);
    const t2 = await towersRepo.findByTowerNumber(10, 'T-02');
    expect(t2?.soilTypeId).toBe(10);
    expect(t2?.foundationTypeId).toBe(100);

    const t1 = await towersRepo.findByTowerNumber(10, 'T-01');
    expect(t1?.soilTypeId).toBeNull();
  });

  it('6. deve validar integridade e reportar combinações inválidas de solo e fundação (RN-13)', async () => {
    const createUseCase = new CreateStakingTowerUseCase(
      towersRepo,
      catalogQuery,
    );
    const validateUseCase = new ValidateStakingIntegrityUseCase(
      towersRepo,
      catalogQuery,
    );

    // Combinação válida (10:100)
    await createUseCase.execute(10, {
      towerNumber: 'T-VAL',
      stationMeters: '100',
      soilTypeId: 10,
      foundationTypeId: 100,
    });

    // Combinação inválida (10:200 não cadastrada na matriz)
    await createUseCase.execute(10, {
      towerNumber: 'T-INVAL',
      stationMeters: '500',
      soilTypeId: 10,
      foundationTypeId: 200,
    });

    const report = await validateUseCase.execute(10);
    expect(report.hasErrors).toBe(true);
    expect(report.invalidCombinationsCount).toBe(1);
    expect(report.invalidCombinations[0].towerNumber).toBe('T-INVAL');
  });

  it('7. deve salvar distribuição preliminar validando a regra de 100% (RN-02)', async () => {
    const saveDistUseCase = new SavePreliminaryDistributionUseCase(
      distRepo,
      catalogQuery,
    );
    const getDistUseCase = new GetPreliminaryDistributionUseCase(
      distRepo,
      catalogQuery,
    );

    // Sucesso com 100%
    await saveDistUseCase.execute(10, {
      soilPercentages: [
        { itemId: 10, code: 'S1', name: 'Solo 1', percentage: 60 },
        { itemId: 20, code: 'S2', name: 'Solo 2', percentage: 40 },
      ],
      foundationPercentages: [
        { itemId: 100, code: 'F1', name: 'Fund 1', percentage: 100 },
      ],
    });

    const saved = await getDistUseCase.execute(10);
    expect(saved).not.toBeNull();
    expect(saved?.soilPercentages.calculateSum()).toBe(100);

    // Erro quando a soma não totaliza 100%
    await expect(
      saveDistUseCase.execute(10, {
        soilPercentages: [
          { itemId: 10, code: 'S1', name: 'Solo 1', percentage: 50 },
        ],
        foundationPercentages: [
          { itemId: 100, code: 'F1', name: 'Fund 1', percentage: 100 },
        ],
      }),
    ).rejects.toThrow(InvalidStakingDistributionException);
  });

  it('8. deve comitar importação PLS-CADD atomicamente preservando dados existentes', async () => {
    const createUseCase = new CreateStakingTowerUseCase(
      towersRepo,
      catalogQuery,
    );
    const commitUseCase = new CommitPlsCaddImportUseCase(
      catalogQuery,
      unitOfWork,
    );

    // Torre existente com atribuições
    await createUseCase.execute(10, {
      towerNumber: 'T-OLD',
      stationMeters: '100',
      soilTypeId: 10,
      foundationTypeId: 100,
      notes: 'Dados preexistentes',
    });

    const result = await commitUseCase.execute(10, {
      fileName: 'teste.csv',
      preserveExistingAssignments: true,
      rows: [
        {
          towerNumber: 'T-OLD',
          stationMeters: 105,
          bodyExtensionMeters: 3,
          deflectionAngleDeg: 0,
          lateralOffsetMeters: 0,
        },
        {
          towerNumber: 'T-NEW',
          stationMeters: 600,
          bodyExtensionMeters: 0,
          deflectionAngleDeg: 0,
          lateralOffsetMeters: 0,
          towerTypeCode: 'T1',
        },
      ],
    });

    expect(result.updatedCount).toBe(1);
    expect(result.importedCount).toBe(1);
    expect(result.preservedCount).toBe(1);

    const preserved = await towersRepo.findByTowerNumber(10, 'T-OLD');
    expect(preserved?.station.meters).toBe(105);
    expect(preserved?.soilTypeId).toBe(10);
  });
});
