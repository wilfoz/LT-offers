import { Module } from '@nestjs/common';
import { HistogramService } from './histogram.service';
import { HistogramController } from './histogram.controller';
import { ScheduleModule } from '../schedule/schedule.module';
import { PrismaService } from '../app/prisma.service';

@Module({
  imports: [ScheduleModule],
  controllers: [HistogramController],
  providers: [HistogramService, PrismaService],
  exports: [HistogramService],
})
export class HistogramModule {}
