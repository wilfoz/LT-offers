import { Module } from '@nestjs/common';
import { ConductorCablesController } from './conductor-cables.controller';
import { ConductorCablesService } from './conductor-cables.service';
import { GroundWiresController } from './ground-wires.controller';
import { GroundWiresService } from './ground-wires.service';
import { GuyWiresController } from './guy-wires.controller';
import { GuyWiresService } from './guy-wires.service';
import { InsulatorsController } from './insulators.controller';
import { InsulatorsService } from './insulators.service';
import { StructureSeriesController } from './structure-series.controller';
import { StructureSeriesService } from './structure-series.service';
import { TowerTypesController } from './tower-types.controller';
import { TowerTypesService } from './tower-types.service';

@Module({
  controllers: [
    ConductorCablesController,
    GroundWiresController,
    GuyWiresController,
    InsulatorsController,
    StructureSeriesController,
    TowerTypesController,
  ],
  providers: [
    ConductorCablesService,
    GroundWiresService,
    GuyWiresService,
    InsulatorsService,
    StructureSeriesService,
    TowerTypesService,
  ],
})
export class CatalogsModule {}
