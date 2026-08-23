import { Module } from '@nestjs/common';
import { ConductorCablesController } from './conductor-cables.controller';
import { ConductorCablesService } from './conductor-cables.service';

@Module({
  controllers: [ConductorCablesController],
  providers: [ConductorCablesService],
})
export class CatalogsModule {}
