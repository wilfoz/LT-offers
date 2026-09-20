import {
  CivilDate,
  EffectivePeriod,
  PendingFieldDetector,
  CatalogItemNotFoundException,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  InvalidCatalogDataException,
  InvalidCivilDateException,
  InvalidEffectiveDateRangeException,
  NoEffectiveVersionFoundException,
  ConductorCableEntity,
  ConductorCableVersionEntity,
  ConductorCablesRepository,
  GroundWireEntity,
  GroundWireVersionEntity,
  GroundWiresRepository,
  GuyWireEntity,
  GuyWireVersionEntity,
  GuyWiresRepository,
  InsulatorEntity,
  InsulatorVersionEntity,
  InsulatorsRepository,
  StructureSeriesEntity,
  StructureSeriesVersionEntity,
  StructureSeriesRepository,
  TowerTypeEntity,
  TowerTypeVersionEntity,
  TowerTypesRepository,
  SoilTypeEntity,
  SoilTypeVersionEntity,
  SoilTypesRepository,
  FoundationTypeEntity,
  FoundationTypeVersionEntity,
  FoundationTypesRepository,
  FoundationVolumeEntity,
  FoundationVolumeVersionEntity,
  FoundationVolumesRepository,
  FixedCostEntity,
  FixedCostVersionEntity,
  FixedCostsRepository,
  EquipmentEntity,
  EquipmentVersionEntity,
  EquipmentRepository,
  LaborRoleEntity,
  LaborRoleVersionEntity,
  LaborRolesRepository,
  WorkCrewEntity,
  WorkCrewVersionEntity,
  WorkCrewsRepository,
} from '../../domain';
import {
  ConductorCablesUseCases,
  GroundWiresUseCases,
  GuyWiresUseCases,
  InsulatorsUseCases,
  StructureSeriesUseCases,
  TowerTypesUseCases,
  SoilTypesUseCases,
  FoundationTypesUseCases,
  FoundationVolumesUseCases,
  FixedCostsUseCases,
  EquipmentUseCases,
  LaborRolesUseCases,
  WorkCrewsUseCases,
} from './';

// Repositórios genéricos em memória para testes
class InMemoryBaseRepository<
  TEntity extends {
    id: number;
    code?: string;
    name?: string;
    versions: ReadonlyArray<any>;
    addVersion: (v: any) => void;
  },
  TVersion,
> {
  protected items: TEntity[] = [];
  protected nextId = 1;
  protected nextVersionId = 1;

  async findById(id: number): Promise<TEntity | null> {
    return this.items.find((i) => i.id === id) || null;
  }

  async findByCode(code: string): Promise<TEntity | null> {
    return this.items.find((i) => (i as any).code === code) || null;
  }

  async list(filter?: { search?: string }): Promise<TEntity[]> {
    if (!filter?.search) return [...this.items];
    const s = filter.search.toLowerCase();
    return this.items.filter(
      (i) =>
        (i as any).code?.toLowerCase().includes(s) ||
        (i as any).name?.toLowerCase().includes(s) ||
        i.versions.some((v: any) => v.description?.toLowerCase().includes(s)),
    );
  }

  async save(entity: TEntity): Promise<TEntity> {
    const id = entity.id > 0 ? entity.id : this.nextId++;
    const cloned = Object.assign(
      Object.create(Object.getPrototypeOf(entity)),
      entity,
      { id },
    );
    this.items.push(cloned);
    return cloned;
  }

  async createVersion(entityId: number, version: TVersion): Promise<TVersion> {
    const entity = await this.findById(entityId);
    if (!entity) throw new Error('Not found');
    const versionId = this.nextVersionId++;
    const cloned = Object.assign(
      Object.create(Object.getPrototypeOf(version)),
      version,
      { id: versionId },
    );
    entity.addVersion(cloned);
    return cloned;
  }
}

class InMemoryConductorCablesRepo
  extends InMemoryBaseRepository<
    ConductorCableEntity,
    ConductorCableVersionEntity
  >
  implements ConductorCablesRepository {}
class InMemoryGroundWiresRepo
  extends InMemoryBaseRepository<GroundWireEntity, GroundWireVersionEntity>
  implements GroundWiresRepository {}
class InMemoryGuyWiresRepo
  extends InMemoryBaseRepository<GuyWireEntity, GuyWireVersionEntity>
  implements GuyWiresRepository {}
class InMemoryInsulatorsRepo
  extends InMemoryBaseRepository<InsulatorEntity, InsulatorVersionEntity>
  implements InsulatorsRepository {}

class InMemoryStructureSeriesRepo
  extends InMemoryBaseRepository<
    StructureSeriesEntity,
    StructureSeriesVersionEntity
  >
  implements StructureSeriesRepository
{
  async findByName(name: string): Promise<StructureSeriesEntity | null> {
    return this.items.find((i) => i.name === name) || null;
  }
}

class InMemoryTowerTypesRepo
  extends InMemoryBaseRepository<TowerTypeEntity, TowerTypeVersionEntity>
  implements TowerTypesRepository
{
  async findBySeriesAndCode(
    structureSeriesId: number,
    code: string,
  ): Promise<TowerTypeEntity | null> {
    return (
      this.items.find(
        (i) => i.structureSeriesId === structureSeriesId && i.code === code,
      ) || null
    );
  }
  async listBySeries(structureSeriesId: number): Promise<TowerTypeEntity[]> {
    return this.items.filter((i) => i.structureSeriesId === structureSeriesId);
  }
}

class InMemorySoilTypesRepo
  extends InMemoryBaseRepository<SoilTypeEntity, SoilTypeVersionEntity>
  implements SoilTypesRepository {}
class InMemoryFoundationTypesRepo
  extends InMemoryBaseRepository<
    FoundationTypeEntity,
    FoundationTypeVersionEntity
  >
  implements FoundationTypesRepository {}

class InMemoryFoundationVolumesRepo
  extends InMemoryBaseRepository<
    FoundationVolumeEntity,
    FoundationVolumeVersionEntity
  >
  implements FoundationVolumesRepository
{
  async list(filter?: any): Promise<FoundationVolumeEntity[]> {
    let result = [...this.items];
    if (filter?.towerTypeId) {
      result = result.filter((i) => i.towerTypeId === filter.towerTypeId);
    }
    if (filter?.soilTypeId) {
      result = result.filter((i) => i.soilTypeId === filter.soilTypeId);
    }
    if (filter?.foundationTypeId) {
      result = result.filter(
        (i) => i.foundationTypeId === filter.foundationTypeId,
      );
    }
    return result;
  }
  async findByCombination(
    towerTypeId: number,
    soilTypeId: number,
    foundationTypeId: number,
  ): Promise<FoundationVolumeEntity | null> {
    return (
      this.items.find(
        (i) =>
          i.towerTypeId === towerTypeId &&
          i.soilTypeId === soilTypeId &&
          i.foundationTypeId === foundationTypeId,
      ) || null
    );
  }
}

class InMemoryFixedCostsRepo
  extends InMemoryBaseRepository<FixedCostEntity, FixedCostVersionEntity>
  implements FixedCostsRepository {}
class InMemoryEquipmentRepo
  extends InMemoryBaseRepository<EquipmentEntity, EquipmentVersionEntity>
  implements EquipmentRepository {}
class InMemoryLaborRolesRepo
  extends InMemoryBaseRepository<LaborRoleEntity, LaborRoleVersionEntity>
  implements LaborRolesRepository {}
class InMemoryWorkCrewsRepo
  extends InMemoryBaseRepository<WorkCrewEntity, WorkCrewVersionEntity>
  implements WorkCrewsRepository {}

describe('Catalogs Context - Domain & Application Tests', () => {
  describe('Value Objects', () => {
    it('deve validar datas civis e rejeitar dias inválidos (RNF-05)', () => {
      const valid = CivilDate.fromString('2026-06-15');
      expect(valid.toIsoDateString()).toBe('2026-06-15');
      expect(() => CivilDate.fromString('2026-02-30')).toThrow(
        InvalidCivilDateException,
      );
      expect(() => CivilDate.fromString('invalido')).toThrow(
        InvalidCivilDateException,
      );
    });

    it('deve validar períodos de vigência e verificar vigência em data de referência', () => {
      const from = CivilDate.fromString('2026-01-01');
      const to = CivilDate.fromString('2026-12-31');
      const period = new EffectivePeriod(from, to);

      expect(period.isEffectiveAt('2026-06-01')).toBe(true);
      expect(period.isEffectiveAt('2025-12-31')).toBe(false);
      expect(period.isEffectiveAt('2027-01-01')).toBe(false);

      expect(() => new EffectivePeriod(to, from)).toThrow(
        InvalidEffectiveDateRangeException,
      );
    });

    it('deve detectar campos pendentes distinguindo null de zero (RNF-09)', () => {
      const labels = { weightTonPerKm: 'peso', utsKn: 'UTS' };
      const missing = PendingFieldDetector.detectMissing(
        { weightTonPerKm: 0, utsKn: null },
        labels,
      );
      expect(missing).toEqual(['UTS']);
    });
  });

  describe('Cables Family Use Cases', () => {
    let conductorRepo: InMemoryConductorCablesRepo;
    let conductorUseCases: ConductorCablesUseCases;
    let groundRepo: InMemoryGroundWiresRepo;
    let groundUseCases: GroundWiresUseCases;

    beforeEach(() => {
      conductorRepo = new InMemoryConductorCablesRepo();
      conductorUseCases = new ConductorCablesUseCases(conductorRepo);
      groundRepo = new InMemoryGroundWiresRepo();
      groundUseCases = new GroundWiresUseCases(groundRepo);
    });

    it('deve criar cabo condutor e listar por data de referência', async () => {
      const item = await conductorUseCases.create(
        {
          code: 'GROSBEAK',
          description: 'Cabo Alumínio ACSR Grosbeak',
          diameterMm: '25.15',
          utsKn: '112.5',
          effectiveFrom: '2026-01-01',
        },
        'engineer@test.com',
      );

      expect(item.id).toBeGreaterThan(0);
      expect(item.code).toBe('GROSBEAK');

      const found = await conductorUseCases.get(
        item.id,
        CivilDate.fromString('2026-06-01'),
      );
      expect(found.entity.code).toBe('GROSBEAK');
      expect(found.effectiveVersion.utsKn).toBe('112.5');

      await expect(
        conductorUseCases.create({ code: 'GROSBEAK' }, 'user'),
      ).rejects.toThrow(DuplicateCatalogCodeException);
    });

    it('deve criar nova versão e rejeitar vigência com data duplicada', async () => {
      const item = await conductorUseCases.create(
        { code: 'DRAKE', effectiveFrom: '2026-01-01' },
        'user',
      );

      const version = await conductorUseCases.createVersion(
        item.id,
        { utsKn: '140.0', effectiveFrom: '2026-06-01' },
        'user',
      );
      expect(version.id).toBeGreaterThan(0);

      await expect(
        conductorUseCases.createVersion(
          item.id,
          { utsKn: '150.0', effectiveFrom: '2026-06-01' },
          'user',
        ),
      ).rejects.toThrow(DuplicateVersionDateException);
    });

    it('deve validar aplicabilidade de campos por tipo STEEL vs OPGW em cabos de guarda', async () => {
      await expect(
        groundUseCases.create(
          {
            code: 'EHS-3/8',
            type: 'STEEL',
            manufacturer: 'Furukawa', // Campo exclusivo de OPGW
          },
          'user',
        ),
      ).rejects.toThrow(InvalidCatalogDataException);

      const opgw = await groundUseCases.create(
        {
          code: 'OPGW-48',
          type: 'OPGW',
          manufacturer: 'Furukawa',
          fiberCount: 48,
          effectiveFrom: '2026-01-01',
        },
        'user',
      );
      expect(opgw.type).toBe('OPGW');
    });
  });

  describe('Structures Family Use Cases', () => {
    let seriesRepo: InMemoryStructureSeriesRepo;
    let towerRepo: InMemoryTowerTypesRepo;
    let seriesUseCases: StructureSeriesUseCases;
    let towerUseCases: TowerTypesUseCases;

    beforeEach(() => {
      seriesRepo = new InMemoryStructureSeriesRepo();
      towerRepo = new InMemoryTowerTypesRepo();
      seriesUseCases = new StructureSeriesUseCases(seriesRepo);
      towerUseCases = new TowerTypesUseCases(towerRepo, seriesRepo);
    });

    it('deve criar série de estruturas e tipo de torre vinculado com tabela de pesos', async () => {
      const series = await seriesUseCases.create(
        { name: 'SÉRIE-500KV', voltageKv: '500' },
        'user',
      );

      const tower = await towerUseCases.create(
        series.id,
        {
          code: 'ESTAIADA-SUSP',
          function: 'SUSPENSION',
          guyCount: 4,
          weights: [
            { heightM: '30.0', weightKg: '4500' },
            { heightM: '35.0', weightKg: '5200' },
          ],
        },
        'user',
      );

      expect(tower.structureSeriesId).toBe(series.id);
      expect(tower.code).toBe('ESTAIADA-SUSP');

      const listed = await towerUseCases.listBySeries(series.id);
      expect(listed).toHaveLength(1);
    });
  });

  describe('Geotech Family Use Cases', () => {
    let soilRepo: InMemorySoilTypesRepo;
    let foundationRepo: InMemoryFoundationTypesRepo;
    let towerRepo: InMemoryTowerTypesRepo;
    let seriesRepo: InMemoryStructureSeriesRepo;
    let volumeRepo: InMemoryFoundationVolumesRepo;

    let soilUseCases: SoilTypesUseCases;
    let foundationUseCases: FoundationTypesUseCases;
    let volumeUseCases: FoundationVolumesUseCases;

    beforeEach(async () => {
      soilRepo = new InMemorySoilTypesRepo();
      foundationRepo = new InMemoryFoundationTypesRepo();
      towerRepo = new InMemoryTowerTypesRepo();
      seriesRepo = new InMemoryStructureSeriesRepo();
      volumeRepo = new InMemoryFoundationVolumesRepo();

      soilUseCases = new SoilTypesUseCases(soilRepo);
      foundationUseCases = new FoundationTypesUseCases(foundationRepo);
      volumeUseCases = new FoundationVolumesUseCases(
        volumeRepo,
        towerRepo,
        soilRepo,
        foundationRepo,
      );

      const series = await seriesRepo.save(
        new StructureSeriesEntity({ id: 0, name: 'SÉRIE-1' }),
      );
      await towerRepo.save(
        new TowerTypeEntity({
          id: 1,
          structureSeriesId: series.id,
          code: 'T1',
          function: 'SUSPENSION',
        }),
      );
      await soilRepo.save(new SoilTypeEntity({ id: 1, code: 'SOLO-AREIA' }));
      await foundationRepo.save(
        new FoundationTypeEntity({
          id: 1,
          code: 'TUBULAO',
          application: 'SELF_SUPPORTING',
        }),
      );
    });

    it('deve criar entrada na matriz de volumes e validar integridade da tripla', async () => {
      const volume = await volumeUseCases.create(
        {
          towerTypeId: 1,
          soilTypeId: 1,
          foundationTypeId: 1,
          concreteFootingsM3: '15.5',
          steelFootingsKg: '800',
        },
        'user',
      );

      expect(volume.id).toBeGreaterThan(0);

      // Combinação duplicada
      await expect(
        volumeUseCases.create(
          { towerTypeId: 1, soilTypeId: 1, foundationTypeId: 1 },
          'user',
        ),
      ).rejects.toThrow(DuplicateCatalogCodeException);
    });
  });

  describe('Operational Family Use Cases', () => {
    let fixedCostRepo: InMemoryFixedCostsRepo;
    let equipmentRepo: InMemoryEquipmentRepo;
    let laborRoleRepo: InMemoryLaborRolesRepo;
    let workCrewRepo: InMemoryWorkCrewsRepo;

    let fixedCostUseCases: FixedCostsUseCases;
    let equipmentUseCases: EquipmentUseCases;
    let laborRoleUseCases: LaborRolesUseCases;
    let workCrewUseCases: WorkCrewsUseCases;

    beforeEach(async () => {
      fixedCostRepo = new InMemoryFixedCostsRepo();
      equipmentRepo = new InMemoryEquipmentRepo();
      laborRoleRepo = new InMemoryLaborRolesRepo();
      workCrewRepo = new InMemoryWorkCrewsRepo();

      fixedCostUseCases = new FixedCostsUseCases(fixedCostRepo);
      equipmentUseCases = new EquipmentUseCases(equipmentRepo);
      laborRoleUseCases = new LaborRolesUseCases(laborRoleRepo);
      workCrewUseCases = new WorkCrewsUseCases(
        workCrewRepo,
        laborRoleRepo,
        equipmentRepo,
      );

      await laborRoleRepo.save(
        new LaborRoleEntity({ id: 1, code: 'MONTADOR', name: 'Montador' }),
      );
      await equipmentRepo.save(
        new EquipmentEntity({
          id: 1,
          code: 'GUINDASTE',
          description: 'Guindaste 50t',
        }),
      );
    });

    it('deve criar equipe com composição de mão de obra e equipamentos', async () => {
      const crew = await workCrewUseCases.create(
        {
          code: 'EQ-MONTAGEM',
          name: 'Equipe de Montagem de Torres',
          standardProductionRate: '2.5',
          productionUnit: 'torre',
          productionPeriod: 'DAY',
          laborRoles: [{ laborRoleId: 1, quantity: '4' }],
          equipments: [{ equipmentId: 1, quantity: '1' }],
        },
        'user',
      );

      expect(crew.id).toBeGreaterThan(0);
      expect(crew.versions[0].laborRoles).toHaveLength(1);
      expect(crew.versions[0].equipments).toHaveLength(1);
    });
  });
});
