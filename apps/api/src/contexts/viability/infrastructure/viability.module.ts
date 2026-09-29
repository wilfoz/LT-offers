import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import {
  VIABILITY_AUCTION_STATS_PORT_TOKEN,
  VIABILITY_OFFER_QUERY_PORT_TOKEN,
  VIABILITY_PARAMETERS_REPOSITORY_TOKEN,
  ViabilityAuctionStatsPort,
  ViabilityOfferQueryPort,
  ViabilityParametersRepository,
} from '../domain';
import {
  CreateViabilityParametersVersionUseCase,
  GetEffectiveViabilityParametersUseCase,
  GetViabilityAssessmentUseCase,
} from '../application/usecases';
import { PrismaViabilityParametersRepository } from './adapters/prisma-viability-parameters.repository';
import { PrismaViabilityAuctionStatsAdapter } from './adapters/prisma-viability-auction-stats.adapter';
import { PrismaViabilityOfferQueryAdapter } from './adapters/prisma-viability-offer-query.adapter';
import { ViabilityController } from './controllers/viability.controller';

@Module({
  controllers: [ViabilityController],
  providers: [
    PrismaService,
    {
      provide: VIABILITY_PARAMETERS_REPOSITORY_TOKEN,
      useClass: PrismaViabilityParametersRepository,
    },
    {
      provide: VIABILITY_AUCTION_STATS_PORT_TOKEN,
      useClass: PrismaViabilityAuctionStatsAdapter,
    },
    {
      provide: VIABILITY_OFFER_QUERY_PORT_TOKEN,
      useClass: PrismaViabilityOfferQueryAdapter,
    },
    {
      provide: GetEffectiveViabilityParametersUseCase,
      useFactory: (repository: ViabilityParametersRepository) =>
        new GetEffectiveViabilityParametersUseCase(repository),
      inject: [VIABILITY_PARAMETERS_REPOSITORY_TOKEN],
    },
    {
      provide: CreateViabilityParametersVersionUseCase,
      useFactory: (repository: ViabilityParametersRepository) =>
        new CreateViabilityParametersVersionUseCase(repository),
      inject: [VIABILITY_PARAMETERS_REPOSITORY_TOKEN],
    },
    {
      provide: GetViabilityAssessmentUseCase,
      useFactory: (
        offerQuery: ViabilityOfferQueryPort,
        parameters: ViabilityParametersRepository,
        auctionStats: ViabilityAuctionStatsPort,
      ) =>
        new GetViabilityAssessmentUseCase(offerQuery, parameters, auctionStats),
      inject: [
        VIABILITY_OFFER_QUERY_PORT_TOKEN,
        VIABILITY_PARAMETERS_REPOSITORY_TOKEN,
        VIABILITY_AUCTION_STATS_PORT_TOKEN,
      ],
    },
  ],
  // Fronteira do contexto: nenhum módulo interno consome a viabilidade hoje.
  exports: [],
})
export class ViabilityModule {}
