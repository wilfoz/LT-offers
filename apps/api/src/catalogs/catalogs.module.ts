import { Module } from '@nestjs/common';
import { ConductorCablesController } from './conductor-cables.controller';
import { ConductorCablesService } from './conductor-cables.service';
import { GroundWiresController } from './ground-wires.controller';
import { GroundWiresService } from './ground-wires.service';

@Module({
  controllers: [ConductorCablesController, GroundWiresController],
  providers: [ConductorCablesService, GroundWiresService],
})
export class CatalogsModule {}
