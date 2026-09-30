import {
  CATALOG_IMPORT_FILE_EXTENSIONS,
  CATALOG_IMPORT_MAX_FILE_BYTES,
  CatalogImportCommitResult,
  CatalogImportCommitRow,
  CatalogImportCommitStatus,
  CatalogImportPreviewResult,
  CatalogImportRowStatus,
} from '@lt-offers/domain';

/** Rótulos, mensagens e cálculos puros da Importação Analítica (RNF-14). */

export const STEPS = [
  'Arquivo',
  'Catálogo',
  'Aba e cabeçalho',
  'Mapeamento e vigência',
  'Prévia',
  'Relatório',
] as const;

export const STATUS_LABELS: Record<CatalogImportRowStatus, string> = {
  TO_IMPORT: 'A importar',
  SKIPPED_EXISTING: 'Ignorada (já cadastrada)',
  DUPLICATE_IN_FILE: 'Duplicada no arquivo',
  INVALID: 'Inválida',
};

export const COMMIT_STATUS_LABELS: Record<CatalogImportCommitStatus, string> = {
  IMPORTED: 'Importado',
  SKIPPED_EXISTING: 'Ignorado (já cadastrado)',
  INVALID: 'Inválido',
};

export const STATUS_BADGES: Record<CatalogImportRowStatus, string> = {
  TO_IMPORT: 'badge-success',
  SKIPPED_EXISTING: 'badge-analysis',
  DUPLICATE_IN_FILE: 'badge-pending',
  INVALID: 'badge-critical',
};

const EXTENSIONS = CATALOG_IMPORT_FILE_EXTENSIONS;

/** Texto de exibição: ".xlsx, .xlsm, .xls ou .csv" — mesma redação da API. */
export const ACCEPTED_LABEL = `${EXTENSIONS.slice(0, -1).join(', ')} ou ${EXTENSIONS[EXTENSIONS.length - 1]}`;

/** Valor do atributo `accept` do input de arquivo: lista separada por vírgula. */
export const ACCEPT_ATTRIBUTE = EXTENSIONS.join(',');

export const MAX_FILE_MB = CATALOG_IMPORT_MAX_FILE_BYTES / (1024 * 1024);

export const UNSUPPORTED_FILE_MESSAGE = `Formato de arquivo não suportado; envie uma planilha ${ACCEPTED_LABEL}`;

export const FILE_TOO_LARGE_MESSAGE = `O arquivo excede o limite de ${MAX_FILE_MB} MB para importação`;

/** Letra da coluna na planilha (0 → A, 26 → AA). */
export function columnLetter(index: number): string {
  let letter = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letter = String.fromCharCode(65 + ((n - 1) % 26)) + letter;
  }
  return letter;
}

/** Resumo de uma linha da amostra para o seletor de cabeçalho. */
export function rowSummary(row: string[]): string {
  const text = row.filter((cell) => cell !== '').join(' | ');
  return text === '' ? '(linha vazia)' : text.slice(0, 90);
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Mensagem da API (string ou lista do ValidationPipe) ou a alternativa. */
export function apiMessage(error: unknown, fallback: string): string {
  const message = (error as { error?: { message?: unknown } })?.error?.message;
  if (Array.isArray(message)) {
    return message.join('; ');
  }
  return typeof message === 'string' && message !== '' ? message : fallback;
}

export interface ImportReport {
  summary: string;
  failures: CatalogImportCommitRow[];
}

/** Relatório final: contagens do commit somadas às já decididas na prévia. */
export function buildImportReport(
  preview: CatalogImportPreviewResult,
  result: CatalogImportCommitResult,
): ImportReport {
  const ignored = preview.counts.SKIPPED_EXISTING + result.skippedExisting;
  const invalid = preview.counts.INVALID + result.invalid;
  const duplicates = preview.counts.DUPLICATE_IN_FILE;
  const parts = [
    plural(result.imported, 'importado', 'importados'),
    plural(ignored, 'ignorado (já cadastrado)', 'ignorados (já cadastrados)'),
    plural(invalid, 'inválido', 'inválidos'),
  ];
  if (duplicates > 0) {
    parts.push(
      plural(duplicates, 'duplicado no arquivo', 'duplicados no arquivo'),
    );
  }
  return {
    summary: parts.join(', '),
    failures: result.rows.filter((r) => r.status !== 'IMPORTED'),
  };
}
