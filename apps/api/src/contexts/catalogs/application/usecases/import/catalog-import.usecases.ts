import {
  CatalogImportCommitRequest,
  CatalogImportCommitResult,
  CatalogImportCommitRow,
  CatalogImportDefinition,
  CatalogImportInspectResult,
  CatalogImportPreviewRequest,
  CatalogImportPreviewResult,
  CatalogImportPreviewRow,
  ImportPayload,
  naturalKeyOf,
} from '@lt-offers/domain';
import {
  CatalogImportTarget,
  CatalogImportTargets,
  DuplicateCatalogCodeException,
  InvalidCatalogDataException,
  InvalidCivilDateException,
  InvalidImportFileException,
  InvalidImportRequestException,
  SpreadsheetReader,
} from '../../../domain';
import {
  INSPECT_PREVIEW_ROWS,
  MAX_IMPORT_ROWS,
  TOO_MANY_ROWS_MESSAGE,
} from './catalog-import.messages';
import {
  DataRow,
  ImportFile,
  assertEffectiveFrom,
  assertMapping,
  assertSupportedFile,
  codeOf,
  dataRowsBelowHeader,
  definitionOf,
  displayRow,
  emptyCounts,
  pickRegistryFields,
  readHeaders,
  readOrFail,
  rowToPayload,
} from './catalog-import.rules';

/** Contexto de uma prévia: catálogo, requisição e chaves já decididas. */
interface PreviewContext {
  definition: CatalogImportDefinition;
  request: CatalogImportPreviewRequest;
  target: CatalogImportTarget;
  existing: Set<string>;
  seen: Set<string>;
}

/** Contexto de um commit: destino, vigência, autor e chaves já existentes. */
interface CommitContext {
  target: CatalogImportTarget;
  effectiveFrom: string;
  createdBy: string;
  existing: Set<string>;
}

/**
 * Importação Analítica dos catálogos planos: inspeção do arquivo, prévia
 * classificada linha a linha e commit apenas dos itens novos (spec
 * catalogos/importacao-analitica). Validação e criação reusam o cadastro de
 * cada catálogo via CatalogImportTargets (design D3).
 */
export class CatalogImportUseCases {
  constructor(
    private readonly reader: SpreadsheetReader,
    private readonly targets: CatalogImportTargets,
  ) {}

  inspect(file: ImportFile | null): CatalogImportInspectResult {
    const { buffer, fileName } = assertSupportedFile(file);
    const sheets = readOrFail(() =>
      this.reader
        .listSheets(buffer, fileName, INSPECT_PREVIEW_ROWS)
        .map((sheet) => ({
          name: sheet.name,
          rows: Array.from(
            { length: Math.min(sheet.rowCount, INSPECT_PREVIEW_ROWS) },
            (_, i) => displayRow(sheet.rowText(i)),
          ),
        })),
    );
    if (sheets.length === 0) {
      throw new InvalidImportFileException('A planilha não contém abas');
    }
    return { fileName, sheets };
  }

  async preview(
    file: ImportFile | null,
    request: CatalogImportPreviewRequest,
  ): Promise<CatalogImportPreviewResult> {
    const { buffer, fileName } = assertSupportedFile(file);
    const definition = definitionOf(request.catalogKey);
    assertEffectiveFrom(request.effectiveFrom);
    assertMapping(definition, request);

    const { sheetName, headers, dataRows } = readOrFail(() => {
      const sheet = this.reader.readSheet(buffer, fileName, request.sheetName);
      if (!sheet) {
        throw new InvalidImportRequestException(
          `A aba "${request.sheetName}" não existe no arquivo`,
        );
      }
      return {
        sheetName: sheet.name,
        headers: readHeaders(definition, sheet, request),
        dataRows: dataRowsBelowHeader(sheet, request.headerRow),
      };
    });

    const rows = await this.classifyRows(dataRows, definition, request);
    const counts = emptyCounts();
    rows.forEach((row) => counts[row.status]++);
    return {
      catalogKey: definition.catalogKey,
      sheetName,
      headerRow: request.headerRow,
      headers,
      firstDataRow: dataRows[0]?.rowNumber ?? null,
      lastDataRow: dataRows[dataRows.length - 1]?.rowNumber ?? null,
      rows,
      counts,
    };
  }

  async commit(
    request: CatalogImportCommitRequest,
    createdBy: string,
  ): Promise<CatalogImportCommitResult> {
    const definition = definitionOf(request.catalogKey);
    assertEffectiveFrom(request.effectiveFrom);
    if (request.items.length > MAX_IMPORT_ROWS) {
      throw new InvalidImportRequestException(TOO_MANY_ROWS_MESSAGE);
    }

    const target = this.targets[definition.catalogKey];
    const context: CommitContext = {
      target,
      effectiveFrom: request.effectiveFrom,
      createdBy,
      existing: new Set((await target.listCodes()).map(naturalKeyOf)),
    };
    // Sequencial de propósito: cada gravação atualiza os códigos existentes
    const rows: CatalogImportCommitRow[] = [];
    for (const item of request.items) {
      rows.push(
        await this.commitItem(pickRegistryFields(definition, item), context),
      );
    }

    const count = (status: CatalogImportCommitRow['status']) =>
      rows.filter((r) => r.status === status).length;
    return {
      catalogKey: definition.catalogKey,
      imported: count('IMPORTED'),
      skippedExisting: count('SKIPPED_EXISTING'),
      invalid: count('INVALID'),
      rows,
    };
  }

  private async classifyRows(
    dataRows: DataRow[],
    definition: CatalogImportDefinition,
    request: CatalogImportPreviewRequest,
  ): Promise<CatalogImportPreviewRow[]> {
    const target = this.targets[definition.catalogKey];
    const context: PreviewContext = {
      definition,
      request,
      target,
      existing: new Set((await target.listCodes()).map(naturalKeyOf)),
      seen: new Set<string>(),
    };
    // Sequencial de propósito: o dedup depende da ordem das linhas
    const rows: CatalogImportPreviewRow[] = [];
    for (const dataRow of dataRows) {
      rows.push(await this.classifyRow(dataRow, context));
    }
    return rows;
  }

  private async classifyRow(
    dataRow: DataRow,
    context: PreviewContext,
  ): Promise<CatalogImportPreviewRow> {
    const { rowNumber } = dataRow;
    const { payload, reasons } = rowToPayload(
      context.definition,
      context.request,
      dataRow,
    );
    const code = codeOf(payload);
    const key = naturalKeyOf(code);
    const skip = (status: 'SKIPPED_EXISTING' | 'DUPLICATE_IN_FILE') => ({
      rowNumber,
      code,
      status,
      reasons: [],
      payload: null,
    });

    // Item já cadastrado é ignorado mesmo se a linha tiver outros defeitos:
    // a importação nunca altera itens existentes (RNF-05)
    if (code !== null && context.existing.has(key)) {
      return skip('SKIPPED_EXISTING');
    }
    if (reasons.length === 0) {
      reasons.push(...(await context.target.validate(payload)));
    }
    if (reasons.length > 0) {
      return { rowNumber, code, status: 'INVALID', reasons, payload: null };
    }
    if (context.seen.has(key)) {
      return skip('DUPLICATE_IN_FILE');
    }
    context.seen.add(key);
    return { rowNumber, code, status: 'TO_IMPORT', reasons: [], payload };
  }

  // Mesma ordem da prévia: existente é ignorado antes de validar
  private async commitItem(
    payload: ImportPayload,
    context: CommitContext,
  ): Promise<CatalogImportCommitRow> {
    const code = codeOf(payload);
    const key = naturalKeyOf(code);
    if (code !== null && context.existing.has(key)) {
      return { code, status: 'SKIPPED_EXISTING', reason: null };
    }
    const reasons = await context.target.validate(payload);
    if (reasons.length > 0) {
      return { code, status: 'INVALID', reason: reasons.join('; ') };
    }
    try {
      await context.target.create(
        payload,
        context.effectiveFrom,
        context.createdBy,
      );
      context.existing.add(key);
      return { code, status: 'IMPORTED', reason: null };
    } catch (error) {
      // Corrida prévia → commit: o código apareceu no meio do caminho (P2002
      // já mapeado pelo repositório) — a linha é ignorada, não aborta (D3)
      if (error instanceof DuplicateCatalogCodeException) {
        context.existing.add(key);
        return { code, status: 'SKIPPED_EXISTING', reason: null };
      }
      if (
        error instanceof InvalidCatalogDataException ||
        error instanceof InvalidCivilDateException
      ) {
        return { code, status: 'INVALID', reason: error.message };
      }
      throw error;
    }
  }
}
