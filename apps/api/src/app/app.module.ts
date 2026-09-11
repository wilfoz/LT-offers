import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { FoundationsModule } from '../foundations/foundations.module';
import { OffersModule } from '../offers/offers.module';
import { StakingModule } from '../staking/staking.module';
import { TaxationModule } from '../taxation/taxation.module';
import { PricingModule } from '../pricing/pricing.module';
import { ElectromechanicalModule } from '../electromechanical/electromechanical.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { HistogramModule } from '../histogram/histogram.module';
import { ServiceBudgetModule } from '../service-budget/service-budget.module';
import { EconomicResultModule } from '../economic-result/economic-result.module';
import { CashflowModule } from '../cashflow/cashflow.module';
import { RisksModule } from '../risks/risks.module';
import { ChecksModule } from '../checks/checks.module';
import { ExportModule } from '../export/export.module';
import { BaselineModule } from '../baseline/baseline.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    CatalogsModule,
    OffersModule,
    StakingModule,
    FoundationsModule,
    TaxationModule,
    PricingModule,
    ElectromechanicalModule,
    ScheduleModule,
    HistogramModule,
    ServiceBudgetModule,
    EconomicResultModule,
    CashflowModule,
    RisksModule,
    ChecksModule,
    ExportModule,
    BaselineModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
