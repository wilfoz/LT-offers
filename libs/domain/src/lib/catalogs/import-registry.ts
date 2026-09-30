/**
 * Registro declarativo de importação dos catálogos planos (Importação
 * Analítica, design D1 da change importacao-analitica-catalogos): fonte única
 * dos campos, rótulos pt-BR, obrigatoriedade e tipo de cada cadastro para a
 * UI de mapeamento, a validação da prévia e a montagem do payload de criação.
 * Os campos espelham os DTOs de criação da API — a paridade é travada por
 * teste no lado da API. Mensagens de erro em pt-BR (RNF-14) ficam nas bordas;
 * aqui as violações são tipadas.
 */
import { Decimal } from 'decimal.js';
import { FIXED_COST_CATEGORY_LABELS } from './fixed-costs';
import { GROUND_WIRE_TYPE_LABELS } from './ground-wires';
import { decimalScaleViolation } from './validation';

export const CATALOG_IMPORT_KEYS = [
  'conductor-cables',
  'ground-wires',
  'guy-wires',
  'insulators',
  'soil-types',
  'labor-roles',
  'equipment',
  'fixed-costs',
] as const;

export type CatalogImportKey = (typeof CATALOG_IMPORT_KEYS)[number];

/** Formatos aceitos; de .xlsm só os valores são lidos — macros nunca executam. */
export const CATALOG_IMPORT_FILE_EXTENSIONS = [
  '.xlsx',
  '.xlsm',
  '.xls',
  '.csv',
] as const;

/** Limite de upload (design D2): o template legado tem ~30 MB. */
export const CATALOG_IMPORT_MAX_FILE_BYTES = 40 * 1024 * 1024;

export function isSupportedImportFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();
  return CATALOG_IMPORT_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export type CatalogImportFieldKind =
  'text' | 'decimal' | 'int' | 'boolean' | 'enum';

export interface CatalogImportField {
  key: string;
  /** Rótulo exibido ao usuário (pt-BR). */
  label: string;
  required: boolean;
  kind: CatalogImportFieldKind;
  /** Total de dígitos da coluna Decimal(p, s) no banco. */
  precision?: number;
  /** Casas decimais aceitas (= escala da coluna no banco, RNF-08). */
  scale?: number;
  /** Menor inteiro aceito (contagens). */
  min?: number;
  maxLength?: number;
  enumValues?: readonly string[];
  /** Rótulos pt-BR por valor; a planilha pode trazer o valor ou o rótulo. */
  enumLabels?: Readonly<Record<string, string>>;
}

export interface CatalogImportDefinition {
  catalogKey: CatalogImportKey;
  label: string;
  /** Rota da listagem do catálogo na web (link do relatório final). */
  route: string;
  /** Campo da chave natural usado no dedup (sempre requerido). */
  naturalKey: string;
  fields: readonly CatalogImportField[];
}

/** Valor cru de célula vindo do parser da planilha. */
export type ImportCellInput = string | number | boolean | null | undefined;

/** Valor normalizado de um campo no payload de criação (null = não informado, RNF-09). */
export type ImportFieldValue = string | number | boolean | null;

export type ImportPayload = Record<string, ImportFieldValue>;

export type ImportCellViolation =
  | 'required'
  | 'not-decimal'
  | 'negative'
  | 'scale-exceeded'
  | 'too-large'
  | 'not-int'
  | 'below-min'
  | 'not-boolean'
  | 'not-enum'
  | 'too-long';

export type ImportCellResult =
  | { ok: true; value: ImportFieldValue }
  | { ok: false; violation: ImportCellViolation };

export type CatalogImportRowStatus =
  'TO_IMPORT' | 'SKIPPED_EXISTING' | 'DUPLICATE_IN_FILE' | 'INVALID';

export type CatalogImportCommitStatus =
  'IMPORTED' | 'SKIPPED_EXISTING' | 'INVALID';

// --- Contratos HTTP trocados entre api e web ---------------------------------

export interface CatalogImportInspectSheet {
  name: string;
  /** Primeiras linhas da aba, células como texto de exibição ('' = vazia). */
  rows: string[][];
}

export interface CatalogImportInspectResult {
  fileName: string;
  sheets: CatalogImportInspectSheet[];
}

export interface CatalogImportPreviewRequest {
  catalogKey: CatalogImportKey;
  sheetName: string;
  /** Linha do cabeçalho na planilha (1 = primeira linha). */
  headerRow: number;
  /** Campo → índice da coluna (0 = primeira coluna). */
  columns: Record<string, number>;
  /** Campo → valor fixo aplicado a todas as linhas. */
  fixedValues: Record<string, string>;
  effectiveFrom: string;
}

export interface CatalogImportPreviewRow {
  /** Número da linha na planilha (1 = primeira linha). */
  rowNumber: number;
  code: string | null;
  status: CatalogImportRowStatus;
  /** Motivos em pt-BR (linhas inválidas). */
  reasons: string[];
  /** Payload normalizado; presente só nas linhas a importar. */
  payload: ImportPayload | null;
}

export interface CatalogImportPreviewResult {
  catalogKey: CatalogImportKey;
  sheetName: string;
  headerRow: number;
  headers: string[];
  /** Intervalo de dados lido (null quando não há linhas abaixo do cabeçalho). */
  firstDataRow: number | null;
  lastDataRow: number | null;
  rows: CatalogImportPreviewRow[];
  counts: Record<CatalogImportRowStatus, number>;
}

export interface CatalogImportCommitRequest {
  catalogKey: CatalogImportKey;
  effectiveFrom: string;
  items: ImportPayload[];
}

export interface CatalogImportCommitRow {
  code: string | null;
  status: CatalogImportCommitStatus;
  reason: string | null;
}

export interface CatalogImportCommitResult {
  catalogKey: CatalogImportKey;
  imported: number;
  skippedExisting: number;
  invalid: number;
  rows: CatalogImportCommitRow[];
}

// --- Registro ----------------------------------------------------------------

const CODE: CatalogImportField = {
  key: 'code',
  label: 'Código',
  required: true,
  kind: 'text',
  maxLength: 50,
};

const DESCRIPTION: CatalogImportField = {
  key: 'description',
  label: 'Descrição',
  required: false,
  kind: 'text',
  maxLength: 200,
};

/** Precisão e escala da coluna Decimal(p, s) no banco. */
type DecimalColumn = readonly [precision: number, scale: number];

const MONEY: DecimalColumn = [12, 2];
const PERCENT: DecimalColumn = [6, 4];
const MEASURE: DecimalColumn = [10, 3];

const decimalField = (
  key: string,
  label: string,
  [precision, scale]: DecimalColumn,
): CatalogImportField => ({
  key,
  label,
  required: false,
  kind: 'decimal',
  precision,
  scale,
});

const intField = (
  key: string,
  label: string,
  min: number,
): CatalogImportField => ({ key, label, required: false, kind: 'int', min });

const textField = (
  key: string,
  label: string,
  maxLength: number,
): CatalogImportField => ({
  key,
  label,
  required: false,
  kind: 'text',
  maxLength,
});

const requiredTextField = (
  key: string,
  label: string,
  maxLength: number,
): CatalogImportField => ({
  ...textField(key, label, maxLength),
  required: true,
});

/** Discriminador obrigatório; valores e rótulos vêm dos contratos do catálogo. */
const enumField = (
  key: string,
  label: string,
  enumLabels: Readonly<Record<string, string>>,
): CatalogImportField => ({
  key,
  label,
  required: true,
  kind: 'enum',
  enumValues: Object.keys(enumLabels),
  enumLabels,
});

// Família de cabos: Decimal(12,4) / (12,2) / (10,3) / (12,2) no schema
const CABLE_COMMON: readonly CatalogImportField[] = [
  DESCRIPTION,
  decimalField('weightTonPerKm', 'Peso (ton/km)', [12, 4]),
  decimalField('reelLengthM', 'Bobina (m)', MONEY),
  decimalField('diameterMm', 'Diâmetro (mm)', MEASURE),
  decimalField('utsKn', 'UTS (kN)', MONEY),
];

const STEEL_SPECIFIC: readonly CatalogImportField[] = [
  textField('galvanizationClass', 'Classe de galvanização', 50),
  textField('strengthGrade', 'Grau de resistência', 50),
  intField('wireCount', 'Número de fios', 1),
];

export const CATALOG_IMPORT_REGISTRY: Readonly<
  Record<CatalogImportKey, CatalogImportDefinition>
> = {
  'conductor-cables': {
    catalogKey: 'conductor-cables',
    label: 'Cabos condutores',
    route: '/catalogs/conductor-cables',
    naturalKey: 'code',
    fields: [CODE, ...CABLE_COMMON],
  },
  'ground-wires': {
    catalogKey: 'ground-wires',
    label: 'Cabos de guarda',
    route: '/catalogs/ground-wires',
    naturalKey: 'code',
    fields: [
      CODE,
      enumField('type', 'Tipo', GROUND_WIRE_TYPE_LABELS),
      ...CABLE_COMMON,
      ...STEEL_SPECIFIC,
      textField('manufacturer', 'Fabricante', 100),
      decimalField('i2tKa2s', 'I²t (kA²·s)', [12, 3]),
      intField('fiberCount', 'Número de fibras', 1),
    ],
  },
  'guy-wires': {
    catalogKey: 'guy-wires',
    label: 'Cabos de tirante',
    route: '/catalogs/guy-wires',
    naturalKey: 'code',
    fields: [CODE, ...CABLE_COMMON, ...STEEL_SPECIFIC],
  },
  insulators: {
    catalogKey: 'insulators',
    label: 'Isoladores',
    route: '/catalogs/insulators',
    naturalKey: 'code',
    fields: [
      CODE,
      DESCRIPTION,
      textField('type', 'Tipo', 100),
      textField('manufacturer', 'Fabricante', 100),
      textField('profile', 'Perfil', 100),
      decimalField('ruptureStrengthKn', 'Carga de ruptura (kN)', MONEY),
      decimalField('diameterMm', 'Diâmetro (mm)', MEASURE),
      decimalField('spacingMm', 'Passo (mm)', MEASURE),
      decimalField('creepageDistanceMm', 'Linha de fuga (mm)', MEASURE),
    ],
  },
  'soil-types': {
    catalogKey: 'soil-types',
    label: 'Tipos de solo',
    route: '/catalogs/soil-types',
    naturalKey: 'code',
    fields: [
      CODE,
      DESCRIPTION,
      { key: 'submerged', label: 'Submerso', required: false, kind: 'boolean' },
      decimalField(
        'allowableCompressionStressKgfCm2',
        'Tensão admissível à compressão (kgf/cm²)',
        MONEY,
      ),
      decimalField('specificWeightKgfM3', 'Peso específico (kgf/m³)', MONEY),
      decimalField(
        'internalFrictionAngleDeg',
        'Ângulo de atrito interno (°)',
        MEASURE,
      ),
      decimalField('cohesionKgCm2', 'Coesão (kg/cm²)', MEASURE),
      intField('nsptMin', 'NSPT mínimo', 0),
      intField('nsptMax', 'NSPT máximo', 0),
    ],
  },
  'labor-roles': {
    catalogKey: 'labor-roles',
    label: 'Mão de obra',
    route: '/catalogs/labor-roles',
    naturalKey: 'code',
    fields: [
      CODE,
      requiredTextField('name', 'Nome do cargo', 100),
      decimalField('baseSalary', 'Salário base (R$)', MONEY),
      decimalField(
        'hazardPayPercent',
        'Adicional de periculosidade (%)',
        PERCENT,
      ),
      decimalField('overtimePercent', 'Hora extra (%)', PERCENT),
      decimalField('dsrOvertimePercent', 'DSR sobre hora extra (%)', PERCENT),
      decimalField('socialChargesPercent', 'Encargos sociais (%)', PERCENT),
      decimalField(
        'foodAllowanceMonthly',
        'Benefício de alimentação (R$/mês)',
        MONEY,
      ),
      decimalField('housingMonthly', 'Alojamento (R$/mês)', MONEY),
      decimalField(
        'homeLeaveTravelMonthly',
        'Folgas de campo com viagem (R$/mês)',
        MONEY,
      ),
      decimalField('healthInsuranceMonthly', 'Plano de saúde (R$/mês)', MONEY),
      decimalField('lifeInsuranceMonthly', 'Seguro de vida (R$/mês)', MONEY),
    ],
  },
  equipment: {
    catalogKey: 'equipment',
    label: 'Equipamentos',
    route: '/catalogs/equipment',
    naturalKey: 'code',
    fields: [
      CODE,
      requiredTextField('description', 'Descrição', 200),
      textField('category', 'Categoria', 100),
      decimalField('externalRentalMonthly', 'Locação externa (R$/mês)', MONEY),
      decimalField('internalRentalMonthly', 'Locação interna (R$/mês)', MONEY),
      decimalField('purchasePrice', 'Preço de compra (R$)', MONEY),
      intField('depreciationYears', 'Anos de amortização', 1),
      intField('ownedAvailabilityCount', 'Disponibilidade própria', 0),
      decimalField(
        'fuelMaintenanceMonthly',
        'Combustível e manutenção (R$/mês)',
        MONEY,
      ),
    ],
  },
  'fixed-costs': {
    catalogKey: 'fixed-costs',
    label: 'Custos fixos',
    route: '/catalogs/fixed-costs',
    naturalKey: 'code',
    fields: [
      CODE,
      requiredTextField('description', 'Descrição', 200),
      enumField('category', 'Categoria', FIXED_COST_CATEGORY_LABELS),
      decimalField('unitCost', 'Custo unitário (R$)', MONEY),
      textField('unit', 'Unidade', 50),
    ],
  },
};

export function isCatalogImportKey(value: unknown): value is CatalogImportKey {
  return (
    typeof value === 'string' &&
    (CATALOG_IMPORT_KEYS as readonly string[]).includes(value)
  );
}

// --- Helpers puros -----------------------------------------------------------

/** Chave de comparação da chave natural: sem espaços nas pontas e sem caixa (design D3). */
export function naturalKeyOf(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function isBlank(raw: ImportCellInput): boolean {
  return raw === null || raw === undefined || String(raw).trim() === '';
}

// Bloco Unicode dos acentos combinantes, separados da letra pela forma NFD
const COMBINING_MARKS_FIRST = 0x300;
const COMBINING_MARKS_LAST = 0x36f;

/** Minúsculas sem acentos, para casar sim/não e rótulos de enumeração. */
function foldText(text: string): string {
  return Array.from(text.trim().toLowerCase().normalize('NFD'))
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < COMBINING_MARKS_FIRST || code > COMBINING_MARKS_LAST;
    })
    .join('');
}

/**
 * Normaliza uma célula decimal para string com ponto (RNF-08). Números do
 * parser são arredondados à escala do campo (design D4); textos com vírgula
 * decimal ("0,85") ou milhar brasileiro ("1.234,56") viram ponto. Texto que
 * não parece número volta como veio (a validação o reprova); vazio → null.
 */
export function normalizeDecimalCell(
  raw: ImportCellInput,
  scale: number,
): string | null {
  if (isBlank(raw)) {
    return null;
  }
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      return String(raw);
    }
    return new Decimal(raw)
      .toDecimalPlaces(scale, Decimal.ROUND_HALF_UP)
      .toFixed();
  }
  const text = String(raw).trim().replace(/\s/g, '');
  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  if (lastComma === -1) {
    return text;
  }
  if (lastDot > lastComma) {
    // "1,234.56": vírgula é separador de milhar
    return text.replace(/,/g, '');
  }
  if (text.indexOf(',') !== lastComma) {
    // Mais de uma vírgula sem ponto depois: ambíguo, a validação reprova
    return text;
  }
  // "1.234,56" ou "0,85": ponto é milhar, vírgula é decimal
  return text.replace(/\./g, '').replace(',', '.');
}

const TRUE_WORDS = ['sim', 's', 'si', 'yes', 'y', 'true', 'verdadeiro', 'x'];
const FALSE_WORDS = ['nao', 'n', 'no', 'false', 'falso'];

function parseBooleanCell(raw: ImportCellInput): boolean | null {
  if (typeof raw === 'boolean') {
    return raw;
  }
  const word = foldText(String(raw));
  if (word === '1' || TRUE_WORDS.includes(word)) {
    return true;
  }
  if (word === '0' || FALSE_WORDS.includes(word)) {
    return false;
  }
  return null;
}

function parseIntCell(raw: ImportCellInput): number | null {
  if (typeof raw === 'number') {
    return Number.isInteger(raw) ? raw : null;
  }
  const text = String(raw).trim();
  return /^-?\d+$/.test(text) ? Number(text) : null;
}

function parseEnumCell(
  field: CatalogImportField,
  raw: ImportCellInput,
): string | null {
  const wanted = foldText(String(raw));
  const labels = field.enumLabels ?? {};
  const match = (field.enumValues ?? []).find(
    (value) =>
      foldText(value) === wanted ||
      (labels[value] !== undefined && foldText(labels[value]) === wanted),
  );
  return match ?? null;
}

function validateDecimalCell(
  field: CatalogImportField,
  raw: ImportCellInput,
): ImportCellResult {
  const scale = field.scale ?? 0;
  const value = normalizeDecimalCell(raw, scale) ?? '';
  const violation = decimalScaleViolation(value, scale);
  if (violation === 'scale-exceeded') {
    return { ok: false, violation: 'scale-exceeded' };
  }
  if (violation !== null) {
    // "-1,5" é número, só que negativo: motivo próprio para orientar o usuário
    const isNegativeNumber =
      value.startsWith('-') &&
      decimalScaleViolation(value.slice(1), scale) !== 'not-decimal';
    return {
      ok: false,
      violation: isNegativeNumber ? 'negative' : 'not-decimal',
    };
  }
  // Dígitos inteiros além de Decimal(p, s) estourariam a coluna no Postgres
  const integerDigits = value.split('.')[0].replace(/^0+/, '').length;
  if (
    field.precision !== undefined &&
    integerDigits > field.precision - scale
  ) {
    return { ok: false, violation: 'too-large' };
  }
  return { ok: true, value };
}

function validateIntCell(
  field: CatalogImportField,
  raw: ImportCellInput,
): ImportCellResult {
  const value = parseIntCell(raw);
  if (value === null) {
    return { ok: false, violation: 'not-int' };
  }
  return field.min !== undefined && value < field.min
    ? { ok: false, violation: 'below-min' }
    : { ok: true, value };
}

/**
 * Converte e valida uma célula conforme o campo do registro. Célula vazia em
 * campo opcional vira null — "não informado", nunca zero nem texto vazio
 * (RNF-09).
 */
export function validateImportCell(
  field: CatalogImportField,
  raw: ImportCellInput,
): ImportCellResult {
  if (isBlank(raw)) {
    return field.required
      ? { ok: false, violation: 'required' }
      : { ok: true, value: null };
  }

  switch (field.kind) {
    case 'decimal':
      return validateDecimalCell(field, raw);
    case 'int':
      return validateIntCell(field, raw);
    case 'boolean': {
      const value = parseBooleanCell(raw);
      return value === null
        ? { ok: false, violation: 'not-boolean' }
        : { ok: true, value };
    }
    case 'enum': {
      const value = parseEnumCell(field, raw);
      return value === null
        ? { ok: false, violation: 'not-enum' }
        : { ok: true, value };
    }
    case 'text': {
      const value = String(raw).trim();
      return field.maxLength !== undefined && value.length > field.maxLength
        ? { ok: false, violation: 'too-long' }
        : { ok: true, value };
    }
  }
}

/**
 * Campos requeridos sem coluna associada e sem valor fixo — bloqueiam a
 * importação (spec: "Campo requerido sem mapeamento bloqueia com orientação").
 */
export function missingRequiredMappings(
  definition: CatalogImportDefinition,
  columns: Record<string, number | null | undefined>,
  fixedValues: Record<string, string | null | undefined>,
): CatalogImportField[] {
  return definition.fields.filter(
    (field) => field.required && !isMapped(field.key, columns, fixedValues),
  );
}

/** Campos opcionais sem associação — geram aviso de "ficará sem dados" (RNF-09). */
export function unmappedOptionalFields(
  definition: CatalogImportDefinition,
  columns: Record<string, number | null | undefined>,
  fixedValues: Record<string, string | null | undefined>,
): CatalogImportField[] {
  return definition.fields.filter(
    (field) => !field.required && !isMapped(field.key, columns, fixedValues),
  );
}

function isMapped(
  key: string,
  columns: Record<string, number | null | undefined>,
  fixedValues: Record<string, string | null | undefined>,
): boolean {
  const column = columns[key];
  const fixed = fixedValues[key];
  return (
    (typeof column === 'number' && column >= 0) ||
    (typeof fixed === 'string' && fixed.trim() !== '')
  );
}
