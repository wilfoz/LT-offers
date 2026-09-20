import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExcelGeneratorService } from './excel-generator.service';
import { PrismaService } from '../app/prisma.service';
import { EconomicsModule } from '../contexts/economics/infrastructure/economics.module';

@Module({
  imports: [EconomicsModule],
  controllers: [ExportController],
  providers: [ExportService, ExcelGeneratorService, PrismaService],
  exports: [ExportService, ExcelGeneratorService],
})
export class ExportModule {}
