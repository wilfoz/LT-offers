import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import { RISKS_REPOSITORY_TOKEN } from '../domain';
import { PrismaRisksRepository } from './adapters';
import {
  GetOfferRisksUseCase,
  SaveRiskUseCase,
  DeleteRiskUseCase,
} from '../application';
import { RisksController } from './controllers/risks.controller';

@Module({
  controllers: [RisksController],
  providers: [
    PrismaService,
    {
      provide: RISKS_REPOSITORY_TOKEN,
      useClass: PrismaRisksRepository,
    },
    GetOfferRisksUseCase,
    SaveRiskUseCase,
    DeleteRiskUseCase,
  ],
  exports: [GetOfferRisksUseCase, SaveRiskUseCase, DeleteRiskUseCase],
})
export class RisksModule {}
