import { Module } from '@nestjs/common';
import { ConductorCablesController } from './conductor-cables.controller';
import { ConductorCablesService } from './conductor-cables.service';
import { FoundationTypesController } from './foundation-types.controller';
import { FoundationTypesService } from './foundation-types.service';
import { FoundationVolumesController } from './foundation-volumes.controller';
import { FoundationVolumesService } from './foundation-volumes.service';
import { GroundWiresController } from './ground-wires.controller';
import { GroundWiresService } from './ground-wires.service';
import { GuyWiresController } from './guy-wires.controller';
import { GuyWiresService } from './guy-wires.service';
import { InsulatorsController } from './insulators.controller';
import { InsulatorsService } from './insulators.service';
import { LaborRolesController } from './labor-roles.controller';
import { LaborRolesService } from './labor-roles.service';
import { SoilTypesController } from './soil-types.controller';
import { SoilTypesService } from './soil-types.service';
import { StructureSeriesController } from './structure-series.controller';
import { StructureSeriesService } from './structure-series.service';
import { TowerTypesController } from './tower-types.controller';
import { TowerTypesService } from './tower-types.service';

@Module({
  controllers: [
    ConductorCablesController,
    FoundationTypesController,
    FoundationVolumesController,
    GroundWiresController,
    GuyWiresController,
    InsulatorsController,
    LaborRolesController,
    SoilTypesController,
    StructureSeriesController,
    TowerTypesController,
  ],
  providers: [
    ConductorCablesService,
    FoundationTypesService,
    FoundationVolumesService,
    GroundWiresService,
    GuyWiresService,
    InsulatorsService,
    LaborRolesService,
    SoilTypesService,
    StructureSeriesService,
    TowerTypesService,
  ],
})
export class CatalogsModule {}
