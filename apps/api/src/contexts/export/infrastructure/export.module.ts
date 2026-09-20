import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import { EconomicsModule } from '../../economics';
import {
  EXPORT_DATA_QUERY_PORT_TOKEN,
  SPREADSHEET_GENERATOR_PORT_TOKEN,
} from '../domain';
import {
  GetPerformanceIndicatorsUseCase,
  GetTenderSheetDataUseCase,
  GetMeasurementSheetDataUseCase,
  GetCashflowExportDataUseCase,
  GetFullOfferPackageUseCase,
  GenerateTenderSheetUseCase,
  GenerateMeasurementSheetUseCase,
  GenerateCashflowSheetUseCase,
} from '../application/usecases';
import {
  ExcelGeneratorAdapter,
  PrismaExportDataQueryAdapter,
} from './adapters';
import { ExportController } from './controllers';

@Module({
  imports: [EconomicsModule],
  controllers: [ExportController],
  providers: [
    PrismaService,
    {
      provide: EXPORT_DATA_QUERY_PORT_TOKEN,
      useClass: PrismaExportDataQueryAdapter,
    },
    {
      provide: SPREADSHEET_GENERATOR_PORT_TOKEN,
      useClass: ExcelGeneratorAdapter,
    },
    GetPerformanceIndicatorsUseCase,
    GetTenderSheetDataUseCase,
    GetMeasurementSheetDataUseCase,
    GetCashflowExportDataUseCase,
    GetFullOfferPackageUseCase,
    GenerateTenderSheetUseCase,
    GenerateMeasurementSheetUseCase,
    GenerateCashflowSheetUseCase,
  ],
  exports: [
    GetPerformanceIndicatorsUseCase,
    GetTenderSheetDataUseCase,
    GetMeasurementSheetDataUseCase,
    GetCashflowExportDataUseCase,
    GetFullOfferPackageUseCase,
    GenerateTenderSheetUseCase,
    GenerateMeasurementSheetUseCase,
    GenerateCashflowSheetUseCase,
  ],
})
export class ExportModule {}
