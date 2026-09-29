import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import { AuditModule } from '../../../audit/audit.module';
import {
  ANEEL_AUCTION_RESULTS_PORT_TOKEN,
  AUCTION_HISTORY_AUDIT_TRAIL_PORT_TOKEN,
  AUCTION_HISTORY_REPOSITORY_TOKEN,
  AneelAuctionResultsPort,
  AuctionHistoryAuditTrailPort,
  AuctionHistoryRepository,
} from '../domain';
import {
  GetAuctionBenchmarkUseCase,
  ListAuctionResultsUseCase,
  SyncAuctionResultsUseCase,
} from '../application/usecases';
import { CkanAneelAuctionResultsAdapter } from './adapters/ckan-aneel-auction-results.adapter';
import { PrismaAuctionHistoryRepository } from './adapters/prisma-auction-history.repository';
import { AuctionHistoryAuditTrailAdapter } from './adapters/audit-service-trail.adapter';
import { AuctionHistoryController } from './controllers/auction-history.controller';

@Module({
  imports: [AuditModule],
  controllers: [AuctionHistoryController],
  providers: [
    PrismaService,
    {
      provide: ANEEL_AUCTION_RESULTS_PORT_TOKEN,
      useClass: CkanAneelAuctionResultsAdapter,
    },
    {
      provide: AUCTION_HISTORY_REPOSITORY_TOKEN,
      useClass: PrismaAuctionHistoryRepository,
    },
    {
      provide: AUCTION_HISTORY_AUDIT_TRAIL_PORT_TOKEN,
      useClass: AuctionHistoryAuditTrailAdapter,
    },
    {
      provide: SyncAuctionResultsUseCase,
      useFactory: (
        source: AneelAuctionResultsPort,
        repository: AuctionHistoryRepository,
        auditTrail: AuctionHistoryAuditTrailPort,
      ) => new SyncAuctionResultsUseCase(source, repository, auditTrail),
      inject: [
        ANEEL_AUCTION_RESULTS_PORT_TOKEN,
        AUCTION_HISTORY_REPOSITORY_TOKEN,
        AUCTION_HISTORY_AUDIT_TRAIL_PORT_TOKEN,
      ],
    },
    {
      provide: ListAuctionResultsUseCase,
      useFactory: (repository: AuctionHistoryRepository) =>
        new ListAuctionResultsUseCase(repository),
      inject: [AUCTION_HISTORY_REPOSITORY_TOKEN],
    },
    {
      provide: GetAuctionBenchmarkUseCase,
      useFactory: (repository: AuctionHistoryRepository) =>
        new GetAuctionBenchmarkUseCase(repository),
      inject: [AUCTION_HISTORY_REPOSITORY_TOKEN],
    },
  ],
  // Fronteira do contexto: nenhum módulo interno consome o histórico hoje;
  // nada é exportado até existir consumidor (precedente electromechanical).
  exports: [],
})
export class AuctionHistoryModule {}
