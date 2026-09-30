import { Injectable, Logger } from '@nestjs/common';
import { ImportCellInput } from '@lt-offers/domain';
import * as XLSX from 'xlsx';
import { SpreadsheetReader, SpreadsheetSheet } from '../../domain';

/**
 * Colunas lidas por aba: planilhas legadas costumam ter o intervalo usado
 * inflado por formatação até colunas muito distantes; os catálogos cabem com
 * folga neste teto.
 */
export const MAX_COLUMNS = 256;

// Só valores e texto formatado: sem fórmulas nem estilos — mais rápido no
// template de ~30 MB e sem executar nada (macros de .xlsm são ignoradas).
const VALUES_ONLY: XLSX.ParsingOptions = {
  cellFormula: false,
  cellHTML: false,
  cellStyles: false,
  cellDates: true,
};

function decodeCsv(buffer: Buffer): string {
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  // CSV exportado pelo Excel em pt-BR costuma vir em Windows-1252
  return utf8.includes('�')
    ? new TextDecoder('windows-1252').decode(buffer)
    : utf8;
}

function cellValue(cell: XLSX.CellObject | undefined): ImportCellInput {
  if (!cell) {
    return null;
  }
  switch (cell.t) {
    case 'n':
    case 's':
    case 'b':
      return cell.v as number | string | boolean;
    case 'd':
      return (cell.v as Date).toISOString().slice(0, 10);
    default:
      // Erro de fórmula (#N/A, #REF!...) e célula vazia contam como vazia
      return null;
  }
}

function cellText(cell: XLSX.CellObject | undefined): string {
  const value = cellValue(cell);
  if (value === null || value === undefined) {
    return '';
  }
  return cell?.w ?? String(value);
}

function toSheet(name: string, worksheet: XLSX.WorkSheet): SpreadsheetSheet {
  const ref = worksheet['!ref'];
  if (!ref) {
    return { name, rowCount: 0, row: () => [], rowText: () => [] };
  }
  // Índices sempre a partir de A1, mesmo que o intervalo usado comece depois
  const range = XLSX.utils.decode_range(ref);
  const lastColumn = Math.min(range.e.c, MAX_COLUMNS - 1);
  const cellsOf = (r: number): (XLSX.CellObject | undefined)[] =>
    Array.from(
      { length: lastColumn + 1 },
      (_, c) => worksheet[XLSX.utils.encode_cell({ r, c })],
    );
  return {
    name,
    rowCount: range.e.r + 1,
    row: (index) => cellsOf(index).map(cellValue),
    rowText: (index) => cellsOf(index).map(cellText),
  };
}

/** Leitura de planilhas com a dependência `xlsx` (SheetJS) já usada no import PLS-CADD. */
@Injectable()
export class XlsxSpreadsheetReader implements SpreadsheetReader {
  listSheets(
    buffer: Buffer,
    fileName: string,
    maxRows: number,
  ): SpreadsheetSheet[] {
    const workbook = this.read(buffer, fileName, { sheetRows: maxRows });
    return workbook.SheetNames.filter((name) => workbook.Sheets[name]).map(
      (name) => toSheet(name, workbook.Sheets[name]),
    );
  }

  readSheet(
    buffer: Buffer,
    fileName: string,
    sheetName: string,
  ): SpreadsheetSheet | null {
    const workbook = this.read(buffer, fileName, { sheets: [sheetName] });
    const worksheet = workbook.Sheets[sheetName];
    return worksheet ? toSheet(sheetName, worksheet) : null;
  }

  private readonly logger = new Logger(XlsxSpreadsheetReader.name);

  // A causa técnica fica no log; o usuário recebe a mensagem pt-BR do caso de uso
  private read(
    buffer: Buffer,
    fileName: string,
    options: XLSX.ParsingOptions,
  ): XLSX.WorkBook {
    try {
      return this.parse(buffer, fileName, options);
    } catch (error) {
      this.logger.warn(
        `Falha ao ler a planilha "${fileName}": ${(error as Error)?.message}`,
      );
      throw error;
    }
  }

  private parse(
    buffer: Buffer,
    fileName: string,
    options: XLSX.ParsingOptions,
  ): XLSX.WorkBook {
    if (/\.csv$/i.test(fileName)) {
      // raw: textos do CSV chegam como estão ("0,85"); a conversão é do registro
      return XLSX.read(decodeCsv(buffer), {
        ...VALUES_ONLY,
        ...options,
        type: 'string',
        raw: true,
      });
    }
    return XLSX.read(buffer, { ...VALUES_ONLY, ...options, type: 'buffer' });
  }
}
