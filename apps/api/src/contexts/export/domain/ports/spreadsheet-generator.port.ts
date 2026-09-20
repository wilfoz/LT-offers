import {
  TenderSheetExportData,
  MeasurementSheetExportData,
  CashflowExportData,
} from '@lt-offers/domain';

/**
 * Porta de geração de planilhas XLSX formatadas (RF-47, RF-48, RF-50, RF-60, RNF-11).
 */
export interface SpreadsheetGeneratorPort {
  generateTenderSheet(data: TenderSheetExportData): Promise<Buffer>;
  generateMeasurementSheet(data: MeasurementSheetExportData): Promise<Buffer>;
  generateCashflowSheet(data: CashflowExportData): Promise<Buffer>;
}
