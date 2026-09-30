import {
  CATALOG_IMPORT_FILE_EXTENSIONS,
  CatalogImportField,
  ImportCellInput,
  ImportCellViolation,
} from '@lt-offers/domain';

/** Mensagens pt-BR (RNF-14) e limites da Importação Analítica. */

/** Linhas mostradas por aba na inspeção, para o usuário apontar o cabeçalho. */
export const INSPECT_PREVIEW_ROWS = 30;

/** Teto de linhas por importação (prévia e commit). */
export const MAX_IMPORT_ROWS = 5000;

// ".xlsx, .xlsm, .xls ou .csv"
const ACCEPTED = `${CATALOG_IMPORT_FILE_EXTENSIONS.slice(0, -1).join(', ')} ou ${CATALOG_IMPORT_FILE_EXTENSIONS[CATALOG_IMPORT_FILE_EXTENSIONS.length - 1]}`;

export const UNSUPPORTED_FILE_MESSAGE = `Formato de arquivo não suportado; envie uma planilha ${ACCEPTED}`;

export const MISSING_FILE_MESSAGE = `Nenhum arquivo foi enviado; selecione uma planilha ${ACCEPTED}`;

export const UNREADABLE_FILE_MESSAGE =
  'Não foi possível ler o arquivo; confira se é uma planilha válida e não protegida por senha';

export const TOO_MANY_ROWS_MESSAGE = `A importação aceita no máximo ${MAX_IMPORT_ROWS} linhas por vez`;

/** Mensagem pt-BR de uma violação de célula, com o valor lido. */
export function cellViolationMessage(
  field: CatalogImportField,
  violation: ImportCellViolation,
  raw: ImportCellInput,
): string {
  const name = `O campo ${field.label}`;
  const value = `(valor lido: "${String(raw ?? '').trim()}")`;
  switch (violation) {
    case 'required':
      return `${name} é obrigatório`;
    case 'not-decimal':
      return `${name} deve ser um número decimal maior ou igual a zero ${value}`;
    case 'negative':
      return `${name} não pode ser negativo ${value}`;
    case 'too-large': {
      const digits = (field.precision ?? 0) - (field.scale ?? 0);
      return `${name} excede o maior valor aceito (${digits} dígitos antes da vírgula) ${value}`;
    }
    case 'scale-exceeded':
      return `${name} deve ter no máximo ${field.scale} casas decimais ${value}`;
    case 'not-int':
      return `${name} deve ser um número inteiro ${value}`;
    case 'below-min':
      return `${name} deve ser maior ou igual a ${field.min} ${value}`;
    case 'not-boolean':
      return `${name} deve ser sim ou não ${value}`;
    case 'not-enum': {
      const options = (field.enumValues ?? [])
        .map((v) => field.enumLabels?.[v] ?? v)
        .join(', ');
      return `${name} deve ser um destes valores: ${options} ${value}`;
    }
    case 'too-long':
      return `${name} deve ter no máximo ${field.maxLength} caracteres ${value}`;
  }
}
