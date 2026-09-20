import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CatalogsModule } from '../contexts/catalogs/infrastructure/catalogs.module';
import { FoundationsModule } from '../contexts/foundations/infrastructure/foundations.module';
import { OffersModule } from '../contexts/offers/infrastructure/offers.module';
import { StakingModule } from '../contexts/staking/infrastructure/staking.module';
import { TaxationModule } from '../contexts/taxation/infrastructure/taxation.module';
import { PricingModule } from '../contexts/pricing/infrastructure/pricing.module';
import { ElectromechanicalModule } from '../electromechanical/electromechanical.module';
import { ScheduleModule } from '../contexts/schedule/infrastructure/schedule.module';
import { HistogramModule } from '../contexts/histogram/infrastructure/histogram.module';
import { EconomicsModule } from '../contexts/economics/infrastructure/economics.module';
import { RisksModule } from '../risks/risks.module';
import { ChecksModule } from '../checks/checks.module';
import { ExportModule } from '../export/export.module';
import { BaselineModule } from '../contexts/baseline/infrastructure/baseline.module';
import { ParityModule } from '../parity/parity.module';
import { FieldFactorsModule } from '../field-factors/field-factors.module';
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
    EconomicsModule,
    RisksModule,
    ChecksModule,
    ExportModule,
    BaselineModule,
    ParityModule,
    FieldFactorsModule,
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
