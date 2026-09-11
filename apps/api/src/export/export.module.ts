import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExcelGeneratorService } from './excel-generator.service';
import { PrismaService } from '../app/prisma.service';
import { EconomicResultModule } from '../economic-result/economic-result.module';
import { CashflowModule } from '../cashflow/cashflow.module';

@Module({
  imports: [EconomicResultModule, CashflowModule],
  controllers: [ExportController],
  providers: [ExportService, ExcelGeneratorService, PrismaService],
  exports: [ExportService, ExcelGeneratorService],
})
export class ExportModule {}
