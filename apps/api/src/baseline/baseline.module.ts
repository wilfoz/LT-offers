import { Module } from '@nestjs/common';
import { BaselineService } from './baseline.service';
import { ProgressTrackingService } from './progress-tracking.service';
import { ChangeOrderService } from './change-order.service';
import { ErpIntegrationService } from './erp-integration.service';
import { BaselineController } from './baseline.controller';
import { PrismaModule } from '../app/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EconomicResultModule } from '../economic-result/economic-result.module';
import { CashflowModule } from '../cashflow/cashflow.module';

@Module({
  imports: [PrismaModule, AuditModule, EconomicResultModule, CashflowModule],
  controllers: [BaselineController],
  providers: [
    BaselineService,
    ProgressTrackingService,
    ChangeOrderService,
    ErpIntegrationService,
  ],
  exports: [
    BaselineService,
    ProgressTrackingService,
    ChangeOrderService,
    ErpIntegrationService,
  ],
})
export class BaselineModule {}
