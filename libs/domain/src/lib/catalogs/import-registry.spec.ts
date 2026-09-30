import {
  CATALOG_IMPORT_KEYS,
  CATALOG_IMPORT_REGISTRY,
  CatalogImportField,
  isCatalogImportKey,
  isSupportedImportFileName,
  missingRequiredMappings,
  naturalKeyOf,
  normalizeDecimalCell,
  unmappedOptionalFields,
  validateImportCell,
} from './import-registry';

const field = (overrides: Partial<CatalogImportField>): CatalogImportField => ({
  key: 'value',
  label: 'Valor',
  required: false,
  kind: 'text',
  ...overrides,
});

describe('CATALOG_IMPORT_REGISTRY', () => {
  it('registra exatamente os 8 catálogos planos, cada um sob a própria chave', () => {
    expect(Object.keys(CATALOG_IMPORT_REGISTRY).sort()).toEqual(
      [...CATALOG_IMPORT_KEYS].sort(),
    );
    for (const key of CATALOG_IMPORT_KEYS) {
      expect(CATALOG_IMPORT_REGISTRY[key].catalogKey).toBe(key);
    }
  });

  it('a chave natural é o código, sempre o primeiro campo e sempre requerido', () => {
    for (const definition of Object.values(CATALOG_IMPORT_REGISTRY)) {
      expect(definition.naturalKey).toBe('code');
      expect(definition.fields[0]).toMatchObject({
        key: 'code',
        required: true,
        kind: 'text',
        maxLength: 50,
      });
    }
  });

  it('não repete campos dentro de um catálogo', () => {
    for (const definition of Object.values(CATALOG_IMPORT_REGISTRY)) {
      const keys = definition.fields.map((f) => f.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('todo decimal declara precisão e escala e todo enum declara valores com rótulo', () => {
    for (const definition of Object.values(CATALOG_IMPORT_REGISTRY)) {
      for (const f of definition.fields) {
        if (f.kind === 'decimal') {
          expect(f.scale).toBeGreaterThanOrEqual(0);
          expect(f.precision).toBeGreaterThan(f.scale ?? 0);
        }
        if (f.kind === 'enum') {
          expect(f.enumValues?.length).toBeGreaterThan(0);
          for (const value of f.enumValues ?? []) {
            expect(f.enumLabels?.[value]).toBeTruthy();
          }
        }
      }
    }
  });

  it('discriminadores obrigatórios: tipo do cabo de guarda e categoria do custo fixo', () => {
    const type = CATALOG_IMPORT_REGISTRY['ground-wires'].fields.find(
      (f) => f.key === 'type',
    );
    expect(type).toMatchObject({
      required: true,
      kind: 'enum',
      enumValues: ['STEEL', 'OPGW'],
    });
    const category = CATALOG_IMPORT_REGISTRY['fixed-costs'].fields.find(
      (f) => f.key === 'category',
    );
    expect(category).toMatchObject({ required: true, kind: 'enum' });
  });

  it('reconhece apenas chaves de catálogo registradas', () => {
    expect(isCatalogImportKey('conductor-cables')).toBe(true);
    expect(isCatalogImportKey('structure-series')).toBe(false);
    expect(isCatalogImportKey(undefined)).toBe(false);
  });
});

describe('normalizeDecimalCell', () => {
  it('troca vírgula decimal por ponto', () => {
    expect(normalizeDecimalCell('0,85', 2)).toBe('0.85');
    expect(normalizeDecimalCell(' 12,5 ', 2)).toBe('12.5');
  });

  it('remove separador de milhar nos formatos brasileiro e inglês', () => {
    expect(normalizeDecimalCell('1.234,56', 2)).toBe('1234.56');
    expect(normalizeDecimalCell('1,234.56', 2)).toBe('1234.56');
  });

  it('converte number do parser para string arredondada à escala do campo', () => {
    expect(normalizeDecimalCell(0.8519, 2)).toBe('0.85');
    expect(normalizeDecimalCell(1.005, 2)).toBe('1.01');
    expect(normalizeDecimalCell(146, 3)).toBe('146');
    expect(normalizeDecimalCell(0.1 + 0.2, 4)).toBe('0.3');
  });

  it('célula vazia vira null (não informado, RNF-09)', () => {
    expect(normalizeDecimalCell(null, 2)).toBeNull();
    expect(normalizeDecimalCell(undefined, 2)).toBeNull();
    expect(normalizeDecimalCell('   ', 2)).toBeNull();
  });

  it('texto não numérico e vírgulas ambíguas voltam como vieram', () => {
    expect(normalizeDecimalCell('abc', 2)).toBe('abc');
    expect(normalizeDecimalCell('1,2,3', 2)).toBe('1,2,3');
  });
});

describe('validateImportCell', () => {
  it('vazio em campo requerido é violação; em opcional vira null, nunca zero', () => {
    expect(validateImportCell(field({ required: true }), '')).toEqual({
      ok: false,
      violation: 'required',
    });
    expect(
      validateImportCell(field({ kind: 'decimal', scale: 2 }), null),
    ).toEqual({ ok: true, value: null });
    expect(validateImportCell(field({ kind: 'int' }), undefined)).toEqual({
      ok: true,
      value: null,
    });
  });

  describe('decimal', () => {
    const dec = field({ kind: 'decimal', scale: 2 });

    it('aceita vírgula e number, devolvendo string com ponto', () => {
      expect(validateImportCell(dec, '0,85')).toEqual({
        ok: true,
        value: '0.85',
      });
      expect(validateImportCell(dec, 12.3456)).toEqual({
        ok: true,
        value: '12.35',
      });
      expect(validateImportCell(dec, '0')).toEqual({ ok: true, value: '0' });
    });

    it('rejeita texto e casas além da escala (texto não é arredondado)', () => {
      expect(validateImportCell(dec, 'abc')).toEqual({
        ok: false,
        violation: 'not-decimal',
      });
      expect(validateImportCell(dec, '-abc')).toEqual({
        ok: false,
        violation: 'not-decimal',
      });
      expect(validateImportCell(dec, '1,234')).toEqual({
        ok: false,
        violation: 'scale-exceeded',
      });
    });

    it('número negativo tem motivo próprio, em number ou texto', () => {
      expect(validateImportCell(dec, -1.5)).toEqual({
        ok: false,
        violation: 'negative',
      });
      expect(validateImportCell(dec, '-0,5')).toEqual({
        ok: false,
        violation: 'negative',
      });
    });

    it('rejeita dígitos inteiros além da precisão da coluna Decimal(p, s)', () => {
      const percent = field({ kind: 'decimal', precision: 6, scale: 4 });
      expect(validateImportCell(percent, '99.9999')).toEqual({
        ok: true,
        value: '99.9999',
      });
      expect(validateImportCell(percent, '0.3')).toEqual({
        ok: true,
        value: '0.3',
      });
      expect(validateImportCell(percent, 100)).toEqual({
        ok: false,
        violation: 'too-large',
      });
      // Zeros à esquerda não contam como dígitos
      expect(validateImportCell(percent, '0012.5')).toEqual({
        ok: true,
        value: '0012.5',
      });
    });
  });

  describe('int', () => {
    const count = field({ kind: 'int', min: 1 });

    it('aceita inteiro em number ou texto', () => {
      expect(validateImportCell(count, 12)).toEqual({ ok: true, value: 12 });
      expect(validateImportCell(count, ' 7 ')).toEqual({ ok: true, value: 7 });
    });

    it('rejeita fração e texto; abaixo do mínimo tem motivo próprio', () => {
      expect(validateImportCell(count, 1.5)).toEqual({
        ok: false,
        violation: 'not-int',
      });
      expect(validateImportCell(count, 'doze')).toEqual({
        ok: false,
        violation: 'not-int',
      });
      expect(validateImportCell(count, 0)).toEqual({
        ok: false,
        violation: 'below-min',
      });
    });

    it('zero é válido quando o mínimo é zero (RNF-09)', () => {
      expect(validateImportCell(field({ kind: 'int', min: 0 }), 0)).toEqual({
        ok: true,
        value: 0,
      });
    });
  });

  describe('boolean', () => {
    const flag = field({ kind: 'boolean' });

    it('reconhece sim/não em português, espanhol e inglês, e 1/0', () => {
      for (const raw of ['Sim', 'S', 'SI', 'yes', 'TRUE', 1, true]) {
        expect(validateImportCell(flag, raw)).toEqual({
          ok: true,
          value: true,
        });
      }
      for (const raw of ['Não', 'nao', 'N', 'no', 'false', 0, false]) {
        expect(validateImportCell(flag, raw)).toEqual({
          ok: true,
          value: false,
        });
      }
    });

    it('rejeita qualquer outro valor', () => {
      expect(validateImportCell(flag, 'talvez')).toEqual({
        ok: false,
        violation: 'not-boolean',
      });
      expect(validateImportCell(flag, 2)).toEqual({
        ok: false,
        violation: 'not-boolean',
      });
    });
  });

  describe('enum', () => {
    const type = CATALOG_IMPORT_REGISTRY['ground-wires'].fields.find(
      (f) => f.key === 'type',
    ) as CatalogImportField;

    it('aceita o valor ou o rótulo, sem diferenciar caixa nem acento', () => {
      expect(validateImportCell(type, 'opgw')).toEqual({
        ok: true,
        value: 'OPGW',
      });
      expect(validateImportCell(type, 'STEEL')).toEqual({
        ok: true,
        value: 'STEEL',
      });
      expect(validateImportCell(type, 'aco')).toEqual({
        ok: true,
        value: 'STEEL',
      });
    });

    it('rejeita valor fora da enumeração', () => {
      expect(validateImportCell(type, 'Alumínio')).toEqual({
        ok: false,
        violation: 'not-enum',
      });
    });
  });

  describe('text', () => {
    const name = field({ kind: 'text', maxLength: 5 });

    it('apara espaços e converte números em texto', () => {
      expect(validateImportCell(name, '  AB  ')).toEqual({
        ok: true,
        value: 'AB',
      });
      expect(validateImportCell(name, 1234)).toEqual({
        ok: true,
        value: '1234',
      });
    });

    it('rejeita texto além do limite de caracteres', () => {
      expect(validateImportCell(name, 'ABCDEF')).toEqual({
        ok: false,
        violation: 'too-long',
      });
    });
  });
});

describe('mapeamento: requeridos e opcionais sem associação', () => {
  const groundWires = CATALOG_IMPORT_REGISTRY['ground-wires'];

  it('requerido sem coluna nem valor fixo é listado; valor fixo satisfaz', () => {
    expect(
      missingRequiredMappings(groundWires, { code: 0 }, {}).map((f) => f.key),
    ).toEqual(['type']);
    expect(
      missingRequiredMappings(groundWires, { code: 0 }, { type: 'OPGW' }),
    ).toEqual([]);
  });

  it('valor fixo em branco não conta como associação', () => {
    expect(
      missingRequiredMappings(
        groundWires,
        {},
        { code: '  ', type: 'OPGW' },
      ).map((f) => f.key),
    ).toEqual(['code']);
  });

  it('opcionais sem associação são listados para o aviso', () => {
    const conductor = CATALOG_IMPORT_REGISTRY['conductor-cables'];
    expect(
      unmappedOptionalFields(
        conductor,
        { code: 0, weightTonPerKm: 1, diameterMm: 2, utsKn: 3 },
        { reelLengthM: '2000' },
      ).map((f) => f.key),
    ).toEqual(['description']);
  });
});

describe('naturalKeyOf', () => {
  it('compara sem espaços nas pontas e sem diferenciar maiúsculas', () => {
    expect(naturalKeyOf('  AAAC 63,36 MCM ')).toBe(
      naturalKeyOf('aaac 63,36 mcm'),
    );
    expect(naturalKeyOf(null)).toBe('');
  });
});

describe('isSupportedImportFileName', () => {
  it('aceita .xlsx, .xlsm, .xls e .csv sem diferenciar caixa', () => {
    for (const name of ['a.xlsx', 'B.XLSM', 'c.xls', 'dados.CSV']) {
      expect(isSupportedImportFileName(name)).toBe(true);
    }
  });

  it('rejeita outros formatos e nomes que só contêm a extensão no meio', () => {
    for (const name of ['projeto.pdf', 'planilha.xlsx.exe', 'xlsx', '']) {
      expect(isSupportedImportFileName(name)).toBe(false);
    }
  });
});
