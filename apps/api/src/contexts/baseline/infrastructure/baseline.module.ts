import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import { AuditModule } from '../../../audit/audit.module';
import { EconomicsModule } from '../../economics/infrastructure/economics.module';
import {
  AUDIT_TRAIL_PORT_TOKEN,
  BASELINE_OFFER_QUERY_PORT_TOKEN,
  BASELINES_REPOSITORY_TOKEN,
  CHANGE_ORDERS_REPOSITORY_TOKEN,
  ERP_SPREADSHEET_PORT_TOKEN,
  PROGRESS_RECORDS_REPOSITORY_TOKEN,
} from '../domain';
import {
  FreezeBaselineUseCase,
  GetActiveBaselineUseCase,
  GetBaselineByIdUseCase,
  ListBaselinesUseCase,
  CreateChangeOrderUseCase,
  UpdateChangeOrderUseCase,
  ListChangeOrdersUseCase,
  GetCurrentWorkingEstimateUseCase,
  RecordMonthlyProgressUseCase,
  GetCurveSUseCase,
  ListProgressRecordsUseCase,
  GenerateErpJsonUseCase,
  GenerateErpXlsxUseCase,
} from '../application';
import { InMemoryBaselinesRepository } from './database/in-memory/in-memory-baselines.repository';
import { InMemoryChangeOrdersRepository } from './database/in-memory/in-memory-change-orders.repository';
import { InMemoryProgressRecordsRepository } from './database/in-memory/in-memory-progress-records.repository';
import { PrismaBaselineOfferQueryAdapter } from './database/prisma/prisma-baseline-offer-query.adapter';
import { AuditServiceTrailAdapter } from './audit/audit-service-trail.adapter';
import { ExcelErpSpreadsheetAdapter } from './spreadsheet/excel-erp-spreadsheet.adapter';
import { BaselineController } from './http/controllers/baseline.controller';

const useCases = [
  FreezeBaselineUseCase,
  GetActiveBaselineUseCase,
  GetBaselineByIdUseCase,
  ListBaselinesUseCase,
  CreateChangeOrderUseCase,
  UpdateChangeOrderUseCase,
  ListChangeOrdersUseCase,
  GetCurrentWorkingEstimateUseCase,
  RecordMonthlyProgressUseCase,
  GetCurveSUseCase,
  ListProgressRecordsUseCase,
  GenerateErpJsonUseCase,
  GenerateErpXlsxUseCase,
];

@Module({
  imports: [AuditModule, EconomicsModule],
  controllers: [BaselineController],
  providers: [
    PrismaService,
    {
      provide: BASELINES_REPOSITORY_TOKEN,
      useClass: InMemoryBaselinesRepository,
    },
    {
      provide: CHANGE_ORDERS_REPOSITORY_TOKEN,
      useClass: InMemoryChangeOrdersRepository,
    },
    {
      provide: PROGRESS_RECORDS_REPOSITORY_TOKEN,
      useClass: InMemoryProgressRecordsRepository,
    },
    {
      provide: BASELINE_OFFER_QUERY_PORT_TOKEN,
      useClass: PrismaBaselineOfferQueryAdapter,
    },
    {
      provide: AUDIT_TRAIL_PORT_TOKEN,
      useClass: AuditServiceTrailAdapter,
    },
    {
      provide: ERP_SPREADSHEET_PORT_TOKEN,
      useClass: ExcelErpSpreadsheetAdapter,
    },
    ...useCases,
  ],
  // Fronteira do contexto: nenhum módulo interno consome baseline hoje;
  // nada é exportado até existir consumidor (precedente electromechanical).
  exports: [],
})
export class BaselineModule {}
