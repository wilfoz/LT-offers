import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import {
  LINE_ELECTROMECHANICAL_QUERY_PORT_TOKEN,
  ELECTROMECHANICAL_CATALOGS_QUERY_PORT_TOKEN,
} from '../domain';
import {
  PrismaLineElectromechanicalQueryAdapter,
  PrismaElectromechanicalCatalogsQueryAdapter,
} from './adapters';
import {
  CalculateLineElectromechanicalUseCase,
  GetLineElectromechanicalTraceabilityUseCase,
} from '../application';
import { ElectromechanicalController } from './controllers/electromechanical.controller';

@Module({
  controllers: [ElectromechanicalController],
  providers: [
    PrismaService,
    {
      provide: LINE_ELECTROMECHANICAL_QUERY_PORT_TOKEN,
      useClass: PrismaLineElectromechanicalQueryAdapter,
    },
    {
      provide: ELECTROMECHANICAL_CATALOGS_QUERY_PORT_TOKEN,
      useClass: PrismaElectromechanicalCatalogsQueryAdapter,
    },
    CalculateLineElectromechanicalUseCase,
    GetLineElectromechanicalTraceabilityUseCase,
  ],
  exports: [
    CalculateLineElectromechanicalUseCase,
    GetLineElectromechanicalTraceabilityUseCase,
  ],
})
export class ElectromechanicalModule {}
