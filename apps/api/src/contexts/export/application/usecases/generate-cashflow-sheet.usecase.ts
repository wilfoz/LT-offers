import { Inject, Injectable } from '@nestjs/common';
import {
  SPREADSHEET_GENERATOR_PORT_TOKEN,
  SpreadsheetGeneratorPort,
} from '../../domain';
import { GetCashflowExportDataUseCase } from './get-cashflow-export-data.usecase';

@Injectable()
export class GenerateCashflowSheetUseCase {
  constructor(
    private readonly getCashflowExportDataUseCase: GetCashflowExportDataUseCase,
    @Inject(SPREADSHEET_GENERATOR_PORT_TOKEN)
    private readonly spreadsheetGenerator: SpreadsheetGeneratorPort,
  ) {}

  /**
   * Exporta o Cronograma de Faturamento e Desembolso em Buffer binário XLSX (RF-60, RNF-11).
   */
  async execute(offerId: number): Promise<Buffer> {
    const data = await this.getCashflowExportDataUseCase.execute(offerId);
    return this.spreadsheetGenerator.generateCashflowSheet(data);
  }
}
