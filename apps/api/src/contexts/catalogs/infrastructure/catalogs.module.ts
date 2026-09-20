import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import {
  CATALOGS_UNIT_OF_WORK,
  CONDUCTOR_CABLES_REPOSITORY,
  GROUND_WIRES_REPOSITORY,
  GUY_WIRES_REPOSITORY,
  INSULATORS_REPOSITORY,
  STRUCTURE_SERIES_REPOSITORY,
  TOWER_TYPES_REPOSITORY,
  SOIL_TYPES_REPOSITORY,
  FOUNDATION_TYPES_REPOSITORY,
  FOUNDATION_VOLUMES_REPOSITORY,
  FIXED_COSTS_REPOSITORY,
  EQUIPMENT_REPOSITORY,
  LABOR_ROLES_REPOSITORY,
  WORK_CREWS_REPOSITORY,
} from '../domain';
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
} from '../application';
import {
  PrismaCatalogsUnitOfWork,
  PrismaConductorCablesRepository,
  PrismaGroundWiresRepository,
  PrismaGuyWiresRepository,
  PrismaInsulatorsRepository,
  PrismaStructureSeriesRepository,
  PrismaTowerTypesRepository,
  PrismaSoilTypesRepository,
  PrismaFoundationTypesRepository,
  PrismaFoundationVolumesRepository,
  PrismaFixedCostsRepository,
  PrismaEquipmentRepository,
  PrismaLaborRolesRepository,
  PrismaWorkCrewsRepository,
} from './database/prisma';
import {
  ConductorCablesController,
  GroundWiresController,
  GuyWiresController,
  InsulatorsController,
  StructureSeriesController,
  TowerTypesController,
  SoilTypesController,
  FoundationTypesController,
  FoundationVolumesController,
  FixedCostsController,
  EquipmentController,
  LaborRolesController,
  WorkCrewsController,
} from './http/controllers';

@Module({
  controllers: [
    ConductorCablesController,
    GroundWiresController,
    GuyWiresController,
    InsulatorsController,
    StructureSeriesController,
    TowerTypesController,
    SoilTypesController,
    FoundationTypesController,
    FoundationVolumesController,
    FixedCostsController,
    EquipmentController,
    LaborRolesController,
    WorkCrewsController,
  ],
  providers: [
    PrismaService,
    // Unit of Work
    {
      provide: CATALOGS_UNIT_OF_WORK,
      useClass: PrismaCatalogsUnitOfWork,
    },
    // Repositories
    {
      provide: CONDUCTOR_CABLES_REPOSITORY,
      useClass: PrismaConductorCablesRepository,
    },
    {
      provide: GROUND_WIRES_REPOSITORY,
      useClass: PrismaGroundWiresRepository,
    },
    {
      provide: GUY_WIRES_REPOSITORY,
      useClass: PrismaGuyWiresRepository,
    },
    {
      provide: INSULATORS_REPOSITORY,
      useClass: PrismaInsulatorsRepository,
    },
    {
      provide: STRUCTURE_SERIES_REPOSITORY,
      useClass: PrismaStructureSeriesRepository,
    },
    {
      provide: TOWER_TYPES_REPOSITORY,
      useClass: PrismaTowerTypesRepository,
    },
    {
      provide: SOIL_TYPES_REPOSITORY,
      useClass: PrismaSoilTypesRepository,
    },
    {
      provide: FOUNDATION_TYPES_REPOSITORY,
      useClass: PrismaFoundationTypesRepository,
    },
    {
      provide: FOUNDATION_VOLUMES_REPOSITORY,
      useClass: PrismaFoundationVolumesRepository,
    },
    {
      provide: FIXED_COSTS_REPOSITORY,
      useClass: PrismaFixedCostsRepository,
    },
    {
      provide: EQUIPMENT_REPOSITORY,
      useClass: PrismaEquipmentRepository,
    },
    {
      provide: LABOR_ROLES_REPOSITORY,
      useClass: PrismaLaborRolesRepository,
    },
    {
      provide: WORK_CREWS_REPOSITORY,
      useClass: PrismaWorkCrewsRepository,
    },
    // Use Cases
    {
      provide: ConductorCablesUseCases,
      useFactory: (repo) => new ConductorCablesUseCases(repo),
      inject: [CONDUCTOR_CABLES_REPOSITORY],
    },
    {
      provide: GroundWiresUseCases,
      useFactory: (repo) => new GroundWiresUseCases(repo),
      inject: [GROUND_WIRES_REPOSITORY],
    },
    {
      provide: GuyWiresUseCases,
      useFactory: (repo) => new GuyWiresUseCases(repo),
      inject: [GUY_WIRES_REPOSITORY],
    },
    {
      provide: InsulatorsUseCases,
      useFactory: (repo) => new InsulatorsUseCases(repo),
      inject: [INSULATORS_REPOSITORY],
    },
    {
      provide: StructureSeriesUseCases,
      useFactory: (repo) => new StructureSeriesUseCases(repo),
      inject: [STRUCTURE_SERIES_REPOSITORY],
    },
    {
      provide: TowerTypesUseCases,
      useFactory: (repo, seriesRepo) =>
        new TowerTypesUseCases(repo, seriesRepo),
      inject: [TOWER_TYPES_REPOSITORY, STRUCTURE_SERIES_REPOSITORY],
    },
    {
      provide: SoilTypesUseCases,
      useFactory: (repo) => new SoilTypesUseCases(repo),
      inject: [SOIL_TYPES_REPOSITORY],
    },
    {
      provide: FoundationTypesUseCases,
      useFactory: (repo) => new FoundationTypesUseCases(repo),
      inject: [FOUNDATION_TYPES_REPOSITORY],
    },
    {
      provide: FoundationVolumesUseCases,
      useFactory: (repo, towerRepo, soilRepo, foundRepo) =>
        new FoundationVolumesUseCases(repo, towerRepo, soilRepo, foundRepo),
      inject: [
        FOUNDATION_VOLUMES_REPOSITORY,
        TOWER_TYPES_REPOSITORY,
        SOIL_TYPES_REPOSITORY,
        FOUNDATION_TYPES_REPOSITORY,
      ],
    },
    {
      provide: FixedCostsUseCases,
      useFactory: (repo) => new FixedCostsUseCases(repo),
      inject: [FIXED_COSTS_REPOSITORY],
    },
    {
      provide: EquipmentUseCases,
      useFactory: (repo) => new EquipmentUseCases(repo),
      inject: [EQUIPMENT_REPOSITORY],
    },
    {
      provide: LaborRolesUseCases,
      useFactory: (repo) => new LaborRolesUseCases(repo),
      inject: [LABOR_ROLES_REPOSITORY],
    },
    {
      provide: WorkCrewsUseCases,
      useFactory: (repo, laborRepo, equipRepo) =>
        new WorkCrewsUseCases(repo, laborRepo, equipRepo),
      inject: [
        WORK_CREWS_REPOSITORY,
        LABOR_ROLES_REPOSITORY,
        EQUIPMENT_REPOSITORY,
      ],
    },
  ],
  exports: [
    CATALOGS_UNIT_OF_WORK,
    CONDUCTOR_CABLES_REPOSITORY,
    GROUND_WIRES_REPOSITORY,
    GUY_WIRES_REPOSITORY,
    INSULATORS_REPOSITORY,
    STRUCTURE_SERIES_REPOSITORY,
    TOWER_TYPES_REPOSITORY,
    SOIL_TYPES_REPOSITORY,
    FOUNDATION_TYPES_REPOSITORY,
    FOUNDATION_VOLUMES_REPOSITORY,
    FIXED_COSTS_REPOSITORY,
    EQUIPMENT_REPOSITORY,
    LABOR_ROLES_REPOSITORY,
    WORK_CREWS_REPOSITORY,
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
  ],
})
export class CatalogsModule {}
