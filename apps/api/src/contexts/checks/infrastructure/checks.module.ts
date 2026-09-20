import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import { CHECKS_DATA_QUERY_PORT_TOKEN } from '../domain';
import { RunOfferChecksUseCase } from '../application/usecases';
import { PrismaChecksDataQueryAdapter } from './adapters';
import { ChecksController } from './controllers';

@Module({
  controllers: [ChecksController],
  providers: [
    PrismaService,
    {
      provide: CHECKS_DATA_QUERY_PORT_TOKEN,
      useClass: PrismaChecksDataQueryAdapter,
    },
    RunOfferChecksUseCase,
  ],
  exports: [RunOfferChecksUseCase],
})
export class ChecksModule {}
