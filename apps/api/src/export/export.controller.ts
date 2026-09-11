import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  TenderSheetLayout,
  TenderSheetExportData,
  MeasurementSheetExportData,
  CashflowExportData,
  PerformanceIndicatorsSummary,
  FullOfferPackage,
} from '@lt-offers/domain';
import { ExportService } from './export.service';
import { RolesGuard } from '../auth/roles.guard';
import { RequireScopes, Audited } from '../auth/auth.decorators';

@Controller('offers/:offerId/export')
@UseGuards(RolesGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * Obtém os indicadores sintéticos de desempenho e custo para benchmarking (RF-49).
   */
  @Get('performance-indicators')
  @RequireScopes('OFFER_READ')
  async getPerformanceIndicators(
    @Param('offerId', ParseIntPipe) offerId: number,
  ): Promise<PerformanceIndicatorsSummary> {
    return this.exportService.getPerformanceIndicators(offerId);
  }

  /**
   * Obtém os dados estruturados da Planilha de Preços do Edital em formato JSON.
   */
  @Get('tender-sheet/data')
  @RequireScopes('OFFER_READ')
  async getTenderSheetData(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Query('layout') layout?: TenderSheetLayout,
  ): Promise<TenderSheetExportData> {
    return this.exportService.getTenderSheetData(offerId, layout);
  }

  /**
   * Exporta a Planilha de Preços do Edital em formato binário XLSX com formatação (RF-47, RF-50, RNF-11).
   */
  @Get('tender-sheet')
  @RequireScopes('OFFER_READ')
  @Audited({
    resource: 'EXPORT',
    action: 'EXPORT',
    description: 'Exportação da Planilha de Preços do Edital em XLSX',
  })
  async downloadTenderSheet(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Query('layout') layout: TenderSheetLayout = 'ANEEL_STANDARD',
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.exportService.exportTenderSheet(offerId, layout);
    const filename = `Planilha_Precos_Edital_Oferta_${offerId}_${layout}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(buffer);
  }

  /**
   * Obtém os dados estruturados da Folha de Medição e PUs em JSON.
   */
  @Get('measurement-sheet/data')
  @RequireScopes('OFFER_READ')
  async getMeasurementSheetData(
    @Param('offerId', ParseIntPipe) offerId: number,
  ): Promise<MeasurementSheetExportData> {
    return this.exportService.getMeasurementSheetData(offerId);
  }

  /**
   * Exporta a Folha de Medição Contratual e Preços Unitários em XLSX (RF-48, RNF-11).
   */
  @Get('measurement-sheet')
  @RequireScopes('OFFER_READ')
  @Audited({
    resource: 'EXPORT',
    action: 'EXPORT',
    description: 'Exportação da Folha de Medição Contratual e PUs em XLSX',
  })
  async downloadMeasurementSheet(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.exportService.exportMeasurementSheet(offerId);
    const filename = `Folha_Medicao_Contratual_Oferta_${offerId}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(buffer);
  }

  /**
   * Obtém os dados estruturados do Cronograma de Faturamento e Desembolso em JSON.
   */
  @Get('cashflow-schedule/data')
  @RequireScopes('OFFER_READ')
  async getCashflowExportData(
    @Param('offerId', ParseIntPipe) offerId: number,
  ): Promise<CashflowExportData> {
    return this.exportService.getCashflowExportData(offerId);
  }

  /**
   * Exporta o Cronograma de Faturamento e Desembolso em XLSX (RF-60, RNF-11).
   */
  @Get('cashflow-schedule')
  @RequireScopes('OFFER_READ')
  @Audited({
    resource: 'EXPORT',
    action: 'EXPORT',
    description: 'Exportação do Cronograma de Faturamento e Desembolso em XLSX',
  })
  async downloadCashflowSheet(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.exportService.exportCashflowSheet(offerId);
    const filename = `Cronograma_Faturamento_Desembolso_Oferta_${offerId}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(buffer);
  }

  /**
   * Exporta o Pacote Aberto Integral da Oferta em formato JSON (RNF-18).
   */
  @Get('full-package')
  @RequireScopes('OFFER_READ')
  @Audited({
    resource: 'EXPORT',
    action: 'EXPORT',
    description: 'Exportação do Pacote Aberto da Oferta em JSON sem vendor lock-in',
  })
  async getFullOfferPackage(
    @Param('offerId', ParseIntPipe) offerId: number,
  ): Promise<FullOfferPackage> {
    return this.exportService.getFullOfferPackage(offerId);
  }
}
