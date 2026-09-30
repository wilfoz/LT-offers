import {
  CATALOG_IMPORT_KEYS,
  CatalogImportKey,
  DATE_PATTERN,
  ImportPayload,
} from '@lt-offers/domain';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsString,
  Matches,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { MAX_IMPORT_ROWS } from '../../../application';

const CATALOG_MESSAGE = 'Catálogo de destino inválido para importação';
const DATE_MESSAGE =
  'A data de início de vigência deve estar no formato AAAA-MM-DD';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Mapa campo → índice de coluna (inteiro ≥ 0). */
@ValidatorConstraint({ name: 'columnIndexMap' })
export class ColumnIndexMap implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (
      isPlainObject(value) &&
      Object.values(value).every(
        (column) => Number.isInteger(column) && (column as number) >= 0,
      )
    );
  }
}

/** Mapa campo → valor fixo em texto. */
@ValidatorConstraint({ name: 'stringValueMap' })
export class StringValueMap implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (
      isPlainObject(value) &&
      Object.values(value).every((fixed) => typeof fixed === 'string')
    );
  }
}

/** Opções da prévia, enviadas no campo multipart `options` como JSON. */
export class CatalogImportPreviewOptionsDto {
  @IsIn(CATALOG_IMPORT_KEYS, { message: CATALOG_MESSAGE })
  catalogKey!: CatalogImportKey;

  @IsString({ message: 'Informe a aba da planilha' })
  @IsNotEmpty({ message: 'Informe a aba da planilha' })
  sheetName!: string;

  @IsInt({
    message:
      'A linha de cabeçalho deve ser um número inteiro maior ou igual a 1',
  })
  @Min(1, {
    message:
      'A linha de cabeçalho deve ser um número inteiro maior ou igual a 1',
  })
  headerRow!: number;

  @Validate(ColumnIndexMap, {
    message:
      'O mapeamento de colunas deve associar cada campo a um índice de coluna (inteiro maior ou igual a 0)',
  })
  columns!: Record<string, number>;

  @Validate(StringValueMap, {
    message: 'Os valores fixos devem ser textos associados a cada campo',
  })
  fixedValues!: Record<string, string>;

  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  effectiveFrom!: string;
}

export class CatalogImportCommitDto {
  @IsIn(CATALOG_IMPORT_KEYS, { message: CATALOG_MESSAGE })
  catalogKey!: CatalogImportKey;

  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  effectiveFrom!: string;

  @IsArray({ message: 'Os itens da importação devem ser uma lista' })
  @ArrayMaxSize(MAX_IMPORT_ROWS, {
    message: `A importação aceita no máximo ${MAX_IMPORT_ROWS} itens por vez`,
  })
  @IsObject({
    each: true,
    message: 'Cada item da importação deve ser um objeto',
  })
  items!: ImportPayload[];
}
