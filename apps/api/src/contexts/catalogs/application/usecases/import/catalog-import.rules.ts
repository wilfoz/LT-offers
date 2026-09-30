import {
  CATALOG_IMPORT_REGISTRY,
  CatalogImportDefinition,
  CatalogImportField,
  CatalogImportPreviewRequest,
  CatalogImportRowStatus,
  ImportCellInput,
  ImportPayload,
  isCatalogImportKey,
  isSupportedImportFileName,
  missingRequiredMappings,
  validateImportCell,
} from '@lt-offers/domain';
import {
  CatalogDomainException,
  CivilDate,
  InvalidImportFileException,
  InvalidImportRequestException,
  SpreadsheetSheet,
} from '../../../domain';
import {
  MAX_IMPORT_ROWS,
  MISSING_FILE_MESSAGE,
  TOO_MANY_ROWS_MESSAGE,
  UNREADABLE_FILE_MESSAGE,
  UNSUPPORTED_FILE_MESSAGE,
  cellViolationMessage,
} from './catalog-import.messages';

/**
 * Regras puras da Importação Analítica: guardas da requisição, recorte das
 * linhas de dados e conversão célula → payload. Mensagens em pt-BR (RNF-14).
 */

export interface ImportFile {
  buffer: Buffer;
  fileName: string;
}

/** Linha de dados: valores crus (números, booleanos) e texto formatado. */
export interface DataRow {
  rowNumber: number;
  values: ImportCellInput[];
  texts: string[];
}

/** Linha como texto de exibição, sem as células vazias do final. */
export function displayRow(texts: string[]): string[] {
  const cells = texts.map((text) => text.trim());
  let end = cells.length;
  while (end > 0 && cells[end - 1] === '') {
    end--;
  }
  return cells.slice(0, end);
}

export function emptyCounts(): Record<CatalogImportRowStatus, number> {
  return {
    TO_IMPORT: 0,
    SKIPPED_EXISTING: 0,
    DUPLICATE_IN_FILE: 0,
    INVALID: 0,
  };
}

export function assertSupportedFile(file: ImportFile | null): ImportFile {
  if (!file || file.buffer.length === 0) {
    throw new InvalidImportFileException(MISSING_FILE_MESSAGE);
  }
  if (!isSupportedImportFileName(file.fileName)) {
    throw new InvalidImportFileException(UNSUPPORTED_FILE_MESSAGE);
  }
  return file;
}

/**
 * Leitura da planilha (inclusive linhas lidas sob demanda): falha do parser
 * vira erro de arquivo (400); exceções de domínio passam como estão.
 */
export function readOrFail<T>(read: () => T): T {
  try {
    return read();
  } catch (error) {
    if (error instanceof CatalogDomainException) {
      throw error;
    }
    throw new InvalidImportFileException(UNREADABLE_FILE_MESSAGE);
  }
}

export function definitionOf(catalogKey: string): CatalogImportDefinition {
  if (!isCatalogImportKey(catalogKey)) {
    throw new InvalidImportRequestException(
      'Catálogo de destino inválido para importação',
    );
  }
  return CATALOG_IMPORT_REGISTRY[catalogKey];
}

function fieldOf(
  definition: CatalogImportDefinition,
  key: string,
): CatalogImportField {
  const field = definition.fields.find((f) => f.key === key);
  if (!field) {
    throw new InvalidImportRequestException(
      `O campo "${key}" não pertence ao catálogo ${definition.label}`,
    );
  }
  return field;
}

/** Data civil com round-trip: 2027-02-30 é rejeitada (InvalidCivilDate → 400). */
export function assertEffectiveFrom(effectiveFrom: string): void {
  CivilDate.fromString(effectiveFrom);
}

function assertFixedValue(
  field: CatalogImportField,
  value: string,
  hasColumn: boolean,
): void {
  if (value.trim() === '') {
    return;
  }
  if (hasColumn) {
    throw new InvalidImportRequestException(
      `Informe uma coluna ou um valor fixo para o campo ${field.label}, não os dois`,
    );
  }
  const result = validateImportCell(field, value);
  if (!result.ok) {
    throw new InvalidImportRequestException(
      `Valor fixo inválido: ${cellViolationMessage(field, result.violation, value)}`,
    );
  }
}

/** Mapeamento: campos do catálogo, valores fixos válidos e requeridos cobertos. */
export function assertMapping(
  definition: CatalogImportDefinition,
  request: CatalogImportPreviewRequest,
): void {
  for (const key of Object.keys(request.columns)) {
    fieldOf(definition, key);
  }
  for (const [key, value] of Object.entries(request.fixedValues)) {
    assertFixedValue(
      fieldOf(definition, key),
      value,
      request.columns[key] !== undefined,
    );
  }
  const missing = missingRequiredMappings(
    definition,
    request.columns,
    request.fixedValues,
  );
  if (missing.length > 0) {
    throw new InvalidImportRequestException(
      missing
        .map(
          (field) =>
            `O campo ${field.label} é requerido: associe uma coluna do arquivo ou informe um valor fixo`,
        )
        .join('; '),
    );
  }
}

/** Cabeçalho dentro da aba e colunas mapeadas dentro do cabeçalho. */
export function readHeaders(
  definition: CatalogImportDefinition,
  sheet: SpreadsheetSheet,
  request: CatalogImportPreviewRequest,
): string[] {
  if (request.headerRow > sheet.rowCount) {
    throw new InvalidImportRequestException(
      `A linha de cabeçalho ${request.headerRow} está além do fim da aba "${sheet.name}" (${sheet.rowCount} linhas)`,
    );
  }
  const headers = displayRow(sheet.rowText(request.headerRow - 1));
  for (const [key, column] of Object.entries(request.columns)) {
    if (column >= headers.length) {
      throw new InvalidImportRequestException(
        `A coluna associada ao campo ${fieldOf(definition, key).label} não existe na linha de cabeçalho`,
      );
    }
  }
  return headers;
}

/**
 * Linhas contíguas abaixo do cabeçalho até a primeira totalmente vazia
 * (design D4: evita arrastar seções empilhadas, caso DB_FUN).
 */
export function dataRowsBelowHeader(
  sheet: SpreadsheetSheet,
  headerRow: number,
): DataRow[] {
  const rows: DataRow[] = [];
  for (let index = headerRow; index < sheet.rowCount; index++) {
    const texts = sheet.rowText(index);
    if (texts.every((text) => text.trim() === '')) {
      break;
    }
    if (rows.length === MAX_IMPORT_ROWS) {
      throw new InvalidImportRequestException(TOO_MANY_ROWS_MESSAGE);
    }
    rows.push({ rowNumber: index + 1, values: sheet.row(index), texts });
  }
  return rows;
}

function rawValue(
  key: string,
  request: CatalogImportPreviewRequest,
  cells: ImportCellInput[],
): ImportCellInput {
  const fixed = request.fixedValues[key];
  if (typeof fixed === 'string' && fixed.trim() !== '') {
    return fixed;
  }
  const column = request.columns[key];
  return column === undefined ? null : cells[column];
}

/** Converte a linha pelo registro: payload normalizado e motivos das células. */
export function rowToPayload(
  definition: CatalogImportDefinition,
  request: CatalogImportPreviewRequest,
  { values, texts }: DataRow,
): { payload: ImportPayload; reasons: string[] } {
  const payload: ImportPayload = {};
  const reasons: string[] = [];
  for (const field of definition.fields) {
    // Campo texto lê o texto formatado da célula: preserva zeros à
    // esquerda de códigos numéricos ("00123")
    const raw = rawValue(
      field.key,
      request,
      field.kind === 'text' ? texts : values,
    );
    const result = validateImportCell(field, raw);
    if (result.ok) {
      payload[field.key] = result.value;
    } else {
      reasons.push(cellViolationMessage(field, result.violation, raw));
    }
  }
  return { payload, reasons };
}

/** Só os campos do registro seguem para o cadastro (bloqueia chaves alheias). */
export function pickRegistryFields(
  definition: CatalogImportDefinition,
  item: ImportPayload,
): ImportPayload {
  return Object.fromEntries(
    definition.fields
      .filter((f) => item[f.key] !== undefined)
      .map((f) => [f.key, item[f.key]]),
  );
}

export function codeOf(payload: ImportPayload): string | null {
  const code = payload['code'];
  return typeof code === 'string' ? code : null;
}
