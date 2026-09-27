import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import {
  SCHEDULE_DATA_QUERY_PORT_TOKEN,
  SCHEDULE_PARAMETERS_PORT_TOKEN,
} from '../domain';
import {
  PrismaScheduleDataQueryAdapter,
  PrismaScheduleParametersAdapter,
} from './adapters';
import {
  GetLineScheduleUseCase,
  GetLineCampsUseCase,
  GetEffectiveRainfallParametersUseCase,
  CreateRainfallParametersVersionUseCase,
  GetEffectiveWorkCalendarUseCase,
  CreateWorkCalendarVersionUseCase,
  ScheduleFacadeService,
} from '../application';
import { ScheduleController } from './controllers/schedule.controller';
import { ScheduleParametersController } from './controllers/schedule-parameters.controller';

@Module({
  controllers: [ScheduleController, ScheduleParametersController],
  providers: [
    PrismaService,
    {
      provide: SCHEDULE_DATA_QUERY_PORT_TOKEN,
      useClass: PrismaScheduleDataQueryAdapter,
    },
    {
      provide: SCHEDULE_PARAMETERS_PORT_TOKEN,
      useClass: PrismaScheduleParametersAdapter,
    },
    GetLineScheduleUseCase,
    GetLineCampsUseCase,
    GetEffectiveRainfallParametersUseCase,
    CreateRainfallParametersVersionUseCase,
    GetEffectiveWorkCalendarUseCase,
    CreateWorkCalendarVersionUseCase,
    ScheduleFacadeService,
  ],
  exports: [ScheduleFacadeService],
})
export class ScheduleModule {}
