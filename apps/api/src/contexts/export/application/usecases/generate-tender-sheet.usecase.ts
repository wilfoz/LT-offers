import { Inject, Injectable } from '@nestjs/common';
import { TenderSheetLayout } from '@lt-offers/domain';
import {
  SPREADSHEET_GENERATOR_PORT_TOKEN,
  SpreadsheetGeneratorPort,
} from '../../domain';
import { GetTenderSheetDataUseCase } from './get-tender-sheet-data.usecase';

@Injectable()
export class GenerateTenderSheetUseCase {
  constructor(
    private readonly getTenderSheetDataUseCase: GetTenderSheetDataUseCase,
    @Inject(SPREADSHEET_GENERATOR_PORT_TOKEN)
    private readonly spreadsheetGenerator: SpreadsheetGeneratorPort,
  ) {}

  /**
   * Exporta a Planilha de Preços do Edital em Buffer binário XLSX (RF-47, RF-50, RNF-11).
   */
  async execute(
    offerId: number,
    layout: TenderSheetLayout = 'ANEEL_STANDARD',
  ): Promise<Buffer> {
    const data = await this.getTenderSheetDataUseCase.execute(offerId, layout);
    return this.spreadsheetGenerator.generateTenderSheet(data);
  }
}
