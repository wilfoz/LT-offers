import {
  CatalogImportKey,
  ImportCellInput,
  ImportPayload,
} from '@lt-offers/domain';

/**
 * Portas da Importação Analítica (change importacao-analitica-catalogos):
 * leitura de planilha e escrita nos catálogos de destino. A orquestração
 * (prévia/commit) não conhece SheetJS, DTOs nem Prisma.
 */

export const SPREADSHEET_READER = Symbol('SPREADSHEET_READER');

/** Aba lida sob demanda: linhas e colunas indexadas a partir de 0 (A1 = [0][0]). */
export interface SpreadsheetSheet {
  name: string;
  rowCount: number;
  /** Valores crus: números como number, booleanos como boolean. */
  row(index: number): ImportCellInput[];
  /** Texto formatado como exibido na planilha ('' = célula vazia). */
  rowText(index: number): string[];
}

export interface SpreadsheetReader {
  /** Todas as abas, lendo só as primeiras `maxRows` linhas de cada uma. */
  listSheets(
    buffer: Buffer,
    fileName: string,
    maxRows: number,
  ): SpreadsheetSheet[];
  /** Uma aba inteira; null se a aba não existe. */
  readSheet(
    buffer: Buffer,
    fileName: string,
    sheetName: string,
  ): SpreadsheetSheet | null;
}

export const CATALOG_IMPORT_TARGETS = Symbol('CATALOG_IMPORT_TARGETS');

/** Catálogo de destino: reusa validação e criação do cadastro manual (design D3). */
export interface CatalogImportTarget {
  /** Códigos já cadastrados (chave natural). */
  listCodes(): Promise<string[]>;
  /** Motivos em pt-BR pelos quais o payload não seria aceito; [] = válido. */
  validate(payload: ImportPayload): Promise<string[]>;
  /** Cria item + versão inicial com a vigência informada. */
  create(
    payload: ImportPayload,
    effectiveFrom: string,
    createdBy: string,
  ): Promise<void>;
}

export type CatalogImportTargets = Record<
  CatalogImportKey,
  CatalogImportTarget
>;
