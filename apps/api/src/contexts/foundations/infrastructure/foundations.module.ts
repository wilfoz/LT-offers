import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import {
  LINE_FOUNDATIONS_QUERY_PORT_TOKEN,
  FOUNDATION_VOLUME_MATRICES_QUERY_PORT_TOKEN,
} from '../domain';
import {
  CalculateLineFoundationsUseCase,
  GetLineFoundationSummaryUseCase,
  GetLineFoundationTraceabilityUseCase,
  GetLineFoundationValidationUseCase,
  FoundationsFacadeService,
} from '../application';
import {
  PrismaLineFoundationsQueryAdapter,
  PrismaFoundationVolumeMatricesQueryAdapter,
} from './database/prisma';
import { FoundationsController } from './http/controllers/foundations.controller';

const useCases = [
  CalculateLineFoundationsUseCase,
  GetLineFoundationSummaryUseCase,
  GetLineFoundationTraceabilityUseCase,
  GetLineFoundationValidationUseCase,
  FoundationsFacadeService,
];

@Module({
  controllers: [FoundationsController],
  providers: [
    PrismaService,
    PrismaLineFoundationsQueryAdapter,
    PrismaFoundationVolumeMatricesQueryAdapter,
    {
      provide: LINE_FOUNDATIONS_QUERY_PORT_TOKEN,
      useClass: PrismaLineFoundationsQueryAdapter,
    },
    {
      provide: FOUNDATION_VOLUME_MATRICES_QUERY_PORT_TOKEN,
      useClass: PrismaFoundationVolumeMatricesQueryAdapter,
    },
    ...useCases,
  ],
  exports: [
    LINE_FOUNDATIONS_QUERY_PORT_TOKEN,
    FOUNDATION_VOLUME_MATRICES_QUERY_PORT_TOKEN,
    ...useCases,
  ],
})
export class FoundationsModule {}
