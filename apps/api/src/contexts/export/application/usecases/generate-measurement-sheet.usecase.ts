import { Inject, Injectable } from '@nestjs/common';
import {
  SPREADSHEET_GENERATOR_PORT_TOKEN,
  SpreadsheetGeneratorPort,
} from '../../domain';
import { GetMeasurementSheetDataUseCase } from './get-measurement-sheet-data.usecase';

@Injectable()
export class GenerateMeasurementSheetUseCase {
  constructor(
    private readonly getMeasurementSheetDataUseCase: GetMeasurementSheetDataUseCase,
    @Inject(SPREADSHEET_GENERATOR_PORT_TOKEN)
    private readonly spreadsheetGenerator: SpreadsheetGeneratorPort,
  ) {}

  /**
   * Exporta a Folha de Medição Contratual e PUs em Buffer binário XLSX (RF-48, RNF-11).
   */
  async execute(offerId: number): Promise<Buffer> {
    const data = await this.getMeasurementSheetDataUseCase.execute(offerId);
    return this.spreadsheetGenerator.generateMeasurementSheet(data);
  }
}
