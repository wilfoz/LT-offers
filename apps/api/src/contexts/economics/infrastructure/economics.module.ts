import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import { ECONOMICS_DATA_QUERY_PORT_TOKEN } from '../domain';
import {
  GetLineServiceBudgetUseCase,
  GetLineMeasurementSheetUseCase,
  GetLineEconomicResultUseCase,
  GetConsolidatedEconomicResultUseCase,
  SimulateMarginOrPriceUseCase,
  CompareRevisionsUseCase,
  GetLineCashflowUseCase,
  GetConsolidatedCashflowUseCase,
  EconomicsFacadeService,
} from '../application';
import { PrismaEconomicsDataQueryAdapter } from './database/prisma/prisma-economics-data-query.adapter';
import { ServiceBudgetController } from './http/controllers/service-budget.controller';
import { EconomicResultController } from './http/controllers/economic-result.controller';
import { CashflowController } from './http/controllers/cashflow.controller';

const useCases = [
  GetLineServiceBudgetUseCase,
  GetLineMeasurementSheetUseCase,
  GetLineEconomicResultUseCase,
  GetConsolidatedEconomicResultUseCase,
  SimulateMarginOrPriceUseCase,
  CompareRevisionsUseCase,
  GetLineCashflowUseCase,
  GetConsolidatedCashflowUseCase,
  EconomicsFacadeService,
];

@Module({
  controllers: [
    ServiceBudgetController,
    EconomicResultController,
    CashflowController,
  ],
  providers: [
    PrismaService,
    PrismaEconomicsDataQueryAdapter,
    {
      provide: ECONOMICS_DATA_QUERY_PORT_TOKEN,
      useClass: PrismaEconomicsDataQueryAdapter,
    },
    ...useCases,
  ],
  // Fronteira do contexto: consumidores externos (export, baseline)
  // enxergam apenas a fachada.
  exports: [EconomicsFacadeService],
})
export class EconomicsModule {}
