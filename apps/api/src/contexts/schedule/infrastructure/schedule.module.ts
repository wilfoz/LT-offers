import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import { SCHEDULE_DATA_QUERY_PORT_TOKEN } from '../domain';
import { PrismaScheduleDataQueryAdapter } from './adapters';
import {
  GetLineScheduleUseCase,
  GetLineCampsUseCase,
  ScheduleFacadeService,
} from '../application';
import { ScheduleController } from './controllers/schedule.controller';

@Module({
  controllers: [ScheduleController],
  providers: [
    PrismaService,
    {
      provide: SCHEDULE_DATA_QUERY_PORT_TOKEN,
      useClass: PrismaScheduleDataQueryAdapter,
    },
    GetLineScheduleUseCase,
    GetLineCampsUseCase,
    ScheduleFacadeService,
  ],
  exports: [ScheduleFacadeService],
})
export class ScheduleModule {}
