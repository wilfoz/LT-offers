import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import { ScheduleModule } from '../../schedule';
import { HISTOGRAM_OFFER_QUERY_PORT_TOKEN } from '../domain';
import { PrismaHistogramOfferQueryAdapter } from './adapters';
import {
  GetLineHistogramUseCase,
  GetOfferConsolidatedHistogramUseCase,
} from '../application';
import { HistogramController } from './controllers/histogram.controller';

@Module({
  imports: [ScheduleModule],
  controllers: [HistogramController],
  providers: [
    PrismaService,
    {
      provide: HISTOGRAM_OFFER_QUERY_PORT_TOKEN,
      useClass: PrismaHistogramOfferQueryAdapter,
    },
    GetLineHistogramUseCase,
    GetOfferConsolidatedHistogramUseCase,
  ],
})
export class HistogramModule {}
