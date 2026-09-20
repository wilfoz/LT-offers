import { Module } from '@nestjs/common';
import { BaselineService } from './baseline.service';
import { ProgressTrackingService } from './progress-tracking.service';
import { ChangeOrderService } from './change-order.service';
import { ErpIntegrationService } from './erp-integration.service';
import { BaselineController } from './baseline.controller';
import { PrismaModule } from '../app/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EconomicsModule } from '../contexts/economics/infrastructure/economics.module';

@Module({
  imports: [PrismaModule, AuditModule, EconomicsModule],
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
