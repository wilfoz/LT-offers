import {
  CATALOG_IMPORT_KEYS,
  CATALOG_IMPORT_REGISTRY,
  CatalogImportField,
  CatalogImportKey,
  ImportFieldValue,
  ImportPayload,
} from '@lt-offers/domain';
import { plainToInstance } from 'class-transformer';
import { getMetadataStorage, validate } from 'class-validator';
import {
  CATALOG_IMPORT_DTOS,
  validateImportPayload,
} from './catalog-import-dtos';

// Paridade registro × DTO (design, Risco 4): o registro declarativo da domain
// não pode divergir do DTO de criação — campo do DTO fora do registro nunca
// seria importado, e campo do registro fora do DTO seria descartado.

function dtoProperties(dto: new () => object): string[] {
  const metadatas = getMetadataStorage().getTargetValidationMetadatas(
    dto,
    '',
    true,
    false,
  );
  return [...new Set(metadatas.map((m) => m.propertyName))];
}

// Valor válido de exemplo por tipo; inteiros crescem com a posição para
// satisfazer regras entre campos (NSPT mínimo < máximo).
function sampleValue(
  field: CatalogImportField,
  index: number,
): ImportFieldValue {
  switch (field.kind) {
    case 'text':
      return field.key === 'code' ? 'COD-1' : 'X';
    case 'decimal':
      return '1.5';
    case 'int':
      return (field.min ?? 0) + index;
    case 'boolean':
      return true;
    case 'enum':
      return field.enumValues?.[0] ?? null;
  }
}

function fullPayload(key: CatalogImportKey): ImportPayload {
  return Object.fromEntries(
    CATALOG_IMPORT_REGISTRY[key].fields.map((f, i) => [
      f.key,
      sampleValue(f, i),
    ]),
  );
}

/** Nomes das regras do DTO que reprovam a propriedade no payload. */
async function failedConstraints(
  key: CatalogImportKey,
  payload: ImportPayload,
  property: string,
): Promise<string[]> {
  const errors = await validate(
    plainToInstance(CATALOG_IMPORT_DTOS[key], payload),
    { whitelist: true },
  );
  return errors
    .filter((e) => e.property === property)
    .flatMap((e) => Object.keys(e.constraints ?? {}));
}

describe.each(CATALOG_IMPORT_KEYS)('paridade registro × DTO: %s', (key) => {
  const definition = CATALOG_IMPORT_REGISTRY[key];
  const dto = CATALOG_IMPORT_DTOS[key];
  const registryKeys = definition.fields.map((f) => f.key);

  it('o registro declara exatamente os campos do DTO de criação (exceto a vigência)', () => {
    const fromDto = dtoProperties(dto).filter((p) => p !== 'effectiveFrom');
    expect([...registryKeys].sort()).toEqual(fromDto.sort());
  });

  it('payload completo gerado do registro passa no DTO sem erros', async () => {
    const payload: ImportPayload = Object.fromEntries(
      definition.fields.map((f, i) => [f.key, sampleValue(f, i)]),
    );
    await expect(validateImportPayload(key, payload)).resolves.toEqual([]);
  });

  it('os requeridos do registro são exatamente os campos que o DTO exige', async () => {
    for (const field of definition.fields) {
      const payload: ImportPayload = Object.fromEntries(
        definition.fields
          .filter((f) => f.required && f.key !== field.key)
          .map((f, i) => [f.key, sampleValue(f, i)]),
      );
      const result = await validateImportPayload(key, payload);
      // Omitir um requerido reprova; omitir um opcional não
      expect(result.length > 0).toBe(field.required);
    }
  });

  // Sondas de fronteira: no limite declarado pelo registro, a regra do
  // próprio campo no DTO aceita; além dele (texto, inteiro, enumeração), o
  // DTO também reprova — registro e DTO concordam em maxLength/min/valores
  it.each(definition.fields.map((f) => [f.key, f] as const))(
    'fronteira do campo %s concorda com o DTO',
    async (_key, field) => {
      const probe = async (value: ImportFieldValue) =>
        failedConstraints(
          key,
          { ...fullPayload(key), [field.key]: value },
          field.key,
        );
      const ownRules = [
        'maxLength',
        'isNotEmpty',
        'isString',
        'min',
        'isInt',
        'isIn',
        'matches',
        'decimalWithScale',
        'isBoolean',
      ];
      const ownFailures = (names: string[]) =>
        names.filter((n) => ownRules.includes(n));

      switch (field.kind) {
        case 'text': {
          const max = field.maxLength ?? 0;
          expect(ownFailures(await probe('X'.repeat(max)))).toEqual([]);
          expect(await probe('X'.repeat(max + 1))).toContain('maxLength');
          break;
        }
        case 'int': {
          const min = field.min ?? 0;
          expect(ownFailures(await probe(min))).toEqual([]);
          expect(await probe(min - 1)).toContain('min');
          break;
        }
        case 'decimal': {
          const atScale = `1.${'1'.repeat(field.scale ?? 0)}`.replace(
            /\.$/,
            '',
          );
          expect(ownFailures(await probe(atScale))).toEqual([]);
          break;
        }
        case 'enum':
          for (const value of field.enumValues ?? []) {
            expect(ownFailures(await probe(value))).toEqual([]);
          }
          expect(await probe('XYZ')).toContain('isIn');
          break;
        case 'boolean':
          expect(ownFailures(await probe(false))).toEqual([]);
          break;
      }
    },
  );
});
