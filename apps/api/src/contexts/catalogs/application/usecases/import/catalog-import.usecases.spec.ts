import {
  CatalogImportKey,
  CatalogImportPreviewRequest,
  ImportCellInput,
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
  SpreadsheetSheet,
} from '../../../domain';
import {
  MAX_IMPORT_ROWS,
  MISSING_FILE_MESSAGE,
  UNSUPPORTED_FILE_MESSAGE,
} from './catalog-import.messages';
import { ImportFile } from './catalog-import.rules';
import { CatalogImportUseCases } from './catalog-import.usecases';

// Aba no formato do DB_CAL: 2 linhas de título antes do cabeçalho (linha 3)
const DB_CAL: ImportCellInput[][] = [
  ['BASES DE DATOS'],
  ['CABLES DE ALUMINIO'],
  ['id', 'Código de conductor', 'Peso (ton/km)', 'Diámetro (mm)', 'UTS (kN)'],
  [1, 'AAAC 63,36 MCM', 0.09203, 7.41, 10.66],
  [2, 'AAAC 77,47 MCM', 0.10791, 8.16, 12.9],
  [3, 'aaac 77,47 mcm', 0.2, 9, 13],
  [4, 'AAAC 105,6 MCM', 'abc', 9.36, 17.01],
  [5, 'AAAC 133,1 MCM', '0,1848', '10,5', 20.5],
  [null, null, null],
  ['CABLES ACSR'],
  [6, 'ACSR 1', 1, 1, 1],
];

function sheetOf(
  name: string,
  rows: ImportCellInput[][],
  texts: Record<number, string[]> = {},
): SpreadsheetSheet {
  return {
    name,
    rowCount: rows.length,
    row: (index) => rows[index] ?? [],
    // Texto formatado: String do valor, salvo quando o teste define outro
    rowText: (index) =>
      texts[index] ??
      (rows[index] ?? []).map((v) => (v == null ? '' : String(v))),
  };
}

function fakeReader(sheets: Record<string, ImportCellInput[][]>) {
  const reader: jest.Mocked<SpreadsheetReader> = {
    listSheets: jest.fn((_buffer, _fileName, maxRows) =>
      Object.entries(sheets).map(([name, rows]) =>
        sheetOf(name, rows.slice(0, maxRows)),
      ),
    ),
    readSheet: jest.fn((_buffer, _fileName, sheetName) =>
      sheets[sheetName] ? sheetOf(sheetName, sheets[sheetName]) : null,
    ),
  };
  return reader;
}

function fakeTarget(existingCodes: string[] = []) {
  const target: jest.Mocked<CatalogImportTarget> = {
    listCodes: jest.fn().mockResolvedValue(existingCodes),
    validate: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue(undefined),
  };
  return target;
}

function targetsWith(
  key: CatalogImportKey,
  target: CatalogImportTarget,
): CatalogImportTargets {
  const unused = fakeTarget();
  return {
    'conductor-cables': unused,
    'ground-wires': unused,
    'guy-wires': unused,
    insulators: unused,
    'soil-types': unused,
    'labor-roles': unused,
    equipment: unused,
    'fixed-costs': unused,
    [key]: target,
  };
}

const FILE: ImportFile = {
  buffer: Buffer.from('conteudo'),
  fileName: 'Calculo LT.xlsm',
};

const CONDUCTOR_REQUEST: CatalogImportPreviewRequest = {
  catalogKey: 'conductor-cables',
  sheetName: 'DB_CAL',
  headerRow: 3,
  columns: { code: 1, weightTonPerKm: 2, diameterMm: 3, utsKn: 4 },
  fixedValues: {},
  effectiveFrom: '2026-01-01',
};

describe('CatalogImportUseCases', () => {
  describe('arquivo', () => {
    const useCases = new CatalogImportUseCases(
      fakeReader({ DB_CAL }),
      targetsWith('conductor-cables', fakeTarget()),
    );

    it('rejeita formato fora de .xlsx/.xlsm/.xls/.csv com a mensagem em português', () => {
      expect(() =>
        useCases.inspect({ buffer: Buffer.from('x'), fileName: 'projeto.pdf' }),
      ).toThrow(new InvalidImportFileException(UNSUPPORTED_FILE_MESSAGE));
    });

    it('aceita .xlsm (template legado), .xls e .csv sem diferenciar caixa', () => {
      for (const fileName of ['a.XLSM', 'b.xls', 'c.csv', 'd.xlsx']) {
        expect(() =>
          useCases.inspect({ buffer: Buffer.from('x'), fileName }),
        ).not.toThrow();
      }
    });

    it('arquivo ausente ou vazio é rejeitado', () => {
      expect(() => useCases.inspect(null)).toThrow(
        new InvalidImportFileException(MISSING_FILE_MESSAGE),
      );
      expect(() =>
        useCases.inspect({ buffer: Buffer.alloc(0), fileName: 'a.xlsx' }),
      ).toThrow(new InvalidImportFileException(MISSING_FILE_MESSAGE));
    });

    it('planilha ilegível vira erro de arquivo, não 500', () => {
      const reader = fakeReader({});
      reader.listSheets.mockImplementation(() => {
        throw new Error('Unsupported file');
      });
      const broken = new CatalogImportUseCases(
        reader,
        targetsWith('conductor-cables', fakeTarget()),
      );
      expect(() => broken.inspect(FILE)).toThrow(
        new InvalidImportFileException(
          'Não foi possível ler o arquivo; confira se é uma planilha válida e não protegida por senha',
        ),
      );
    });
  });

  describe('inspect', () => {
    it('devolve as abas com as primeiras linhas em texto, sem células vazias no fim', () => {
      const reader = fakeReader({ DB_CAL, Info: [['Proposta', null, null]] });
      const useCases = new CatalogImportUseCases(
        reader,
        targetsWith('conductor-cables', fakeTarget()),
      );

      const result = useCases.inspect(FILE);

      expect(reader.listSheets).toHaveBeenCalledWith(
        FILE.buffer,
        FILE.fileName,
        30,
      );
      expect(result.fileName).toBe('Calculo LT.xlsm');
      expect(result.sheets.map((s) => s.name)).toEqual(['DB_CAL', 'Info']);
      expect(result.sheets[0].rows[3]).toEqual([
        '1',
        'AAAC 63,36 MCM',
        '0.09203',
        '7.41',
        '10.66',
      ]);
      expect(result.sheets[0].rows[8]).toEqual([]);
      expect(result.sheets[1].rows).toEqual([['Proposta']]);
    });
  });

  describe('preview', () => {
    it('classifica cada linha: existente ignorada, duplicada no arquivo, inválida com motivo e a importar', async () => {
      const target = fakeTarget(['AAAC 63,36 MCM']);
      const useCases = new CatalogImportUseCases(
        fakeReader({ DB_CAL }),
        targetsWith('conductor-cables', target),
      );

      const result = await useCases.preview(FILE, CONDUCTOR_REQUEST);

      expect(result.headers).toEqual([
        'id',
        'Código de conductor',
        'Peso (ton/km)',
        'Diámetro (mm)',
        'UTS (kN)',
      ]);
      // Intervalo contíguo abaixo do cabeçalho até a 1ª linha vazia (D4):
      // a seção "CABLES ACSR" empilhada abaixo não entra
      expect(result.firstDataRow).toBe(4);
      expect(result.lastDataRow).toBe(8);
      expect(result.rows.map((r) => [r.rowNumber, r.code, r.status])).toEqual([
        [4, 'AAAC 63,36 MCM', 'SKIPPED_EXISTING'],
        [5, 'AAAC 77,47 MCM', 'TO_IMPORT'],
        [6, 'aaac 77,47 mcm', 'DUPLICATE_IN_FILE'],
        [7, 'AAAC 105,6 MCM', 'INVALID'],
        [8, 'AAAC 133,1 MCM', 'TO_IMPORT'],
      ]);
      expect(result.rows[3].reasons).toEqual([
        'O campo Peso (ton/km) deve ser um número decimal maior ou igual a zero (valor lido: "abc")',
      ]);
      expect(result.counts).toEqual({
        TO_IMPORT: 2,
        SKIPPED_EXISTING: 1,
        DUPLICATE_IN_FILE: 1,
        INVALID: 1,
      });
    });

    it('normaliza os payloads: número arredondado à escala, vírgula decimal e opcional não mapeado como null (RNF-09)', async () => {
      const useCases = new CatalogImportUseCases(
        fakeReader({ DB_CAL }),
        targetsWith('conductor-cables', fakeTarget()),
      );

      const result = await useCases.preview(FILE, CONDUCTOR_REQUEST);

      expect(result.rows[1].payload).toEqual({
        code: 'AAAC 77,47 MCM',
        description: null,
        weightTonPerKm: '0.1079',
        reelLengthM: null,
        diameterMm: '8.16',
        utsKn: '12.9',
      });
      expect(result.rows[4].payload).toMatchObject({
        weightTonPerKm: '0.1848',
        diameterMm: '10.5',
      });
      expect(result.rows[4].status).toBe('TO_IMPORT');
    });

    it('texto com casas além da escala é inválido, não arredondado', async () => {
      const rows = [
        ['Código', 'Peso'],
        ['X1', '0,18479'],
      ];
      const useCases = new CatalogImportUseCases(
        fakeReader({ S: rows }),
        targetsWith('conductor-cables', fakeTarget()),
      );
      const result = await useCases.preview(FILE, {
        ...CONDUCTOR_REQUEST,
        sheetName: 'S',
        headerRow: 1,
        columns: { code: 0, weightTonPerKm: 1 },
      });
      expect(result.rows[0].status).toBe('INVALID');
      expect(result.rows[0].reasons).toEqual([
        'O campo Peso (ton/km) deve ter no máximo 4 casas decimais (valor lido: "0,18479")',
      ]);
    });

    it('número negativo e valor além da precisão da coluna têm motivos próprios', async () => {
      const rows = [
        ['Código', 'Nome', 'Periculosidade'],
        ['ELE', 'Eletricista', -0.3],
        ['ENC', 'Encarregado', 100],
      ];
      const useCases = new CatalogImportUseCases(
        fakeReader({ DB_MO: rows }),
        targetsWith('labor-roles', fakeTarget()),
      );
      const result = await useCases.preview(FILE, {
        catalogKey: 'labor-roles',
        sheetName: 'DB_MO',
        headerRow: 1,
        columns: { code: 0, name: 1, hazardPayPercent: 2 },
        fixedValues: {},
        effectiveFrom: '2026-01-01',
      });
      expect(result.rows.map((r) => r.reasons)).toEqual([
        [
          'O campo Adicional de periculosidade (%) não pode ser negativo (valor lido: "-0.3")',
        ],
        [
          'O campo Adicional de periculosidade (%) excede o maior valor aceito (2 dígitos antes da vírgula) (valor lido: "100")',
        ],
      ]);
    });

    it('campo texto usa o texto formatado da célula (zeros à esquerda do código)', async () => {
      const rows: ImportCellInput[][] = [
        ['Código', 'Peso'],
        [123, 0.5],
      ];
      const useCases = new CatalogImportUseCases(
        {
          listSheets: jest.fn(),
          readSheet: jest.fn(() =>
            sheetOf('S', rows, { 1: ['00123', '0,50'] }),
          ),
        },
        targetsWith('conductor-cables', fakeTarget()),
      );
      const result = await useCases.preview(FILE, {
        ...CONDUCTOR_REQUEST,
        sheetName: 'S',
        headerRow: 1,
        columns: { code: 0, weightTonPerKm: 1 },
      });
      expect(result.rows[0].payload).toMatchObject({
        code: '00123',
        weightTonPerKm: '0.5',
      });
    });

    it('valor fixo é aplicado a todas as linhas (tipo OPGW dos cabos de guarda)', async () => {
      const rows = [
        ['Código del cable', 'Fabricante'],
        ['DG1 16 kA2s', 'FURUKAWA'],
        ['DS1 49 kA2s', 'FURUKAWA'],
      ];
      const target = fakeTarget();
      const useCases = new CatalogImportUseCases(
        fakeReader({ DB_OPGW: rows }),
        targetsWith('ground-wires', target),
      );

      const result = await useCases.preview(FILE, {
        catalogKey: 'ground-wires',
        sheetName: 'DB_OPGW',
        headerRow: 1,
        columns: { code: 0, manufacturer: 1 },
        fixedValues: { type: 'OPGW' },
        effectiveFrom: '2026-01-01',
      });

      expect(result.rows.map((r) => r.payload?.['type'])).toEqual([
        'OPGW',
        'OPGW',
      ]);
      expect(target.validate).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'OPGW', manufacturer: 'FURUKAWA' }),
      );
    });

    it('linha reprovada pela validação do cadastro (DTO/domínio) é inválida sem bloquear as demais', async () => {
      const target = fakeTarget();
      target.validate
        .mockResolvedValueOnce([
          'O NSPT mínimo deve ser menor que o NSPT máximo',
        ])
        .mockResolvedValue([]);
      const rows = [
        ['Código', 'Descrição'],
        ['S1', 'Argila'],
        ['S2', 'Areia'],
      ];
      const useCases = new CatalogImportUseCases(
        fakeReader({ DB_FUN: rows }),
        targetsWith('soil-types', target),
      );

      const result = await useCases.preview(FILE, {
        catalogKey: 'soil-types',
        sheetName: 'DB_FUN',
        headerRow: 1,
        columns: { code: 0, description: 1 },
        fixedValues: {},
        effectiveFrom: '2026-01-01',
      });

      expect(result.rows.map((r) => r.status)).toEqual([
        'INVALID',
        'TO_IMPORT',
      ]);
      expect(result.rows[0].reasons).toEqual([
        'O NSPT mínimo deve ser menor que o NSPT máximo',
      ]);
    });

    it('campo requerido sem coluna nem valor fixo bloqueia com orientação', async () => {
      const useCases = new CatalogImportUseCases(
        fakeReader({ DB_OPGW: [['Código']] }),
        targetsWith('ground-wires', fakeTarget()),
      );
      await expect(
        useCases.preview(FILE, {
          catalogKey: 'ground-wires',
          sheetName: 'DB_OPGW',
          headerRow: 1,
          columns: { code: 0 },
          fixedValues: {},
          effectiveFrom: '2026-01-01',
        }),
      ).rejects.toThrow(
        new InvalidImportRequestException(
          'O campo Tipo é requerido: associe uma coluna do arquivo ou informe um valor fixo',
        ),
      );
    });

    it('vigência com data inexistente (2027-02-30) é rejeitada', async () => {
      const useCases = new CatalogImportUseCases(
        fakeReader({ DB_CAL }),
        targetsWith('conductor-cables', fakeTarget()),
      );
      await expect(
        useCases.preview(FILE, {
          ...CONDUCTOR_REQUEST,
          effectiveFrom: '2027-02-30',
        }),
      ).rejects.toThrow(InvalidCivilDateException);
    });

    it('rejeita aba inexistente, cabeçalho além do fim, coluna fora do cabeçalho, campo alheio, valor fixo inválido e coluna + valor fixo juntos', async () => {
      const useCases = new CatalogImportUseCases(
        fakeReader({ DB_CAL }),
        targetsWith('conductor-cables', fakeTarget()),
      );
      const cases: [Partial<CatalogImportPreviewRequest>, string][] = [
        [{ sheetName: 'DB_XX' }, 'A aba "DB_XX" não existe no arquivo'],
        [
          { headerRow: 40 },
          'A linha de cabeçalho 40 está além do fim da aba "DB_CAL" (11 linhas)',
        ],
        [
          { columns: { code: 1, utsKn: 9 } },
          'A coluna associada ao campo UTS (kN) não existe na linha de cabeçalho',
        ],
        [
          { columns: { code: 1, color: 2 } },
          'O campo "color" não pertence ao catálogo Cabos condutores',
        ],
        [
          { columns: { code: 1 }, fixedValues: { reelLengthM: 'muito' } },
          'Valor fixo inválido: O campo Bobina (m) deve ser um número decimal maior ou igual a zero (valor lido: "muito")',
        ],
        [
          { columns: { code: 1, utsKn: 4 }, fixedValues: { utsKn: '10' } },
          'Informe uma coluna ou um valor fixo para o campo UTS (kN), não os dois',
        ],
      ];
      for (const [override, message] of cases) {
        await expect(
          useCases.preview(FILE, { ...CONDUCTOR_REQUEST, ...override }),
        ).rejects.toThrow(new InvalidImportRequestException(message));
      }
    });

    it(`aba com mais de ${MAX_IMPORT_ROWS} linhas de dados é rejeitada`, async () => {
      const rows: ImportCellInput[][] = [
        ['Código'],
        ...Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => [`C${i}`]),
      ];
      const useCases = new CatalogImportUseCases(
        fakeReader({ S: rows }),
        targetsWith('conductor-cables', fakeTarget()),
      );
      await expect(
        useCases.preview(FILE, {
          ...CONDUCTOR_REQUEST,
          sheetName: 'S',
          headerRow: 1,
          columns: { code: 0 },
        }),
      ).rejects.toThrow(
        new InvalidImportRequestException(
          'A importação aceita no máximo 5000 linhas por vez',
        ),
      );
    });

    it('falha do parser ao ler linhas sob demanda vira erro de arquivo, não 500', async () => {
      const broken: SpreadsheetSheet = {
        name: 'S',
        rowCount: 3,
        row: () => [],
        rowText: (index) => {
          if (index > 0) {
            throw new Error('célula corrompida');
          }
          return ['Código'];
        },
      };
      const useCases = new CatalogImportUseCases(
        { listSheets: jest.fn(), readSheet: jest.fn(() => broken) },
        targetsWith('conductor-cables', fakeTarget()),
      );
      await expect(
        useCases.preview(FILE, {
          ...CONDUCTOR_REQUEST,
          sheetName: 'S',
          headerRow: 1,
          columns: { code: 0 },
        }),
      ).rejects.toThrow(
        new InvalidImportFileException(
          'Não foi possível ler o arquivo; confira se é uma planilha válida e não protegida por senha',
        ),
      );
    });

    it('catálogo fora do registro (hierárquico) é rejeitado', async () => {
      const useCases = new CatalogImportUseCases(
        fakeReader({ DB_CAL }),
        targetsWith('conductor-cables', fakeTarget()),
      );
      await expect(
        useCases.preview(FILE, {
          ...CONDUCTOR_REQUEST,
          catalogKey: 'structure-series' as CatalogImportKey,
        }),
      ).rejects.toThrow(
        new InvalidImportRequestException(
          'Catálogo de destino inválido para importação',
        ),
      );
    });
  });

  describe('commit', () => {
    const items = [
      { code: 'NOVO 1', weightTonPerKm: '0.1' },
      { code: 'aaac 63,36 mcm', weightTonPerKm: '0.2' },
      { code: 'NOVO 2', weightTonPerKm: '0.3' },
      { code: 'NOVO 3', weightTonPerKm: '0.4' },
      { code: 'NOVO 4', weightTonPerKm: '0.5' },
    ];

    it('grava só os novos com a vigência e o autor; existentes, corrida (P2002) e inválidos entram no relatório', async () => {
      const target = fakeTarget(['AAAC 63,36 MCM']);
      target.validate.mockImplementation(async (payload) =>
        payload['code'] === 'NOVO 4' ? ['O código é obrigatório'] : [],
      );
      target.create.mockImplementation(async (payload) => {
        if (payload['code'] === 'NOVO 2') {
          throw new DuplicateCatalogCodeException('NOVO 2');
        }
        if (payload['code'] === 'NOVO 3') {
          throw new InvalidCatalogDataException('Dado inválido no cadastro');
        }
      });
      const useCases = new CatalogImportUseCases(
        fakeReader({}),
        targetsWith('conductor-cables', target),
      );

      const result = await useCases.commit(
        { catalogKey: 'conductor-cables', effectiveFrom: '2026-01-01', items },
        'maria',
      );

      expect(target.create).toHaveBeenCalledWith(
        { code: 'NOVO 1', weightTonPerKm: '0.1' },
        '2026-01-01',
        'maria',
      );
      expect(target.create).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        catalogKey: 'conductor-cables',
        imported: 1,
        skippedExisting: 2,
        invalid: 2,
        rows: [
          { code: 'NOVO 1', status: 'IMPORTED', reason: null },
          { code: 'aaac 63,36 mcm', status: 'SKIPPED_EXISTING', reason: null },
          { code: 'NOVO 2', status: 'SKIPPED_EXISTING', reason: null },
          {
            code: 'NOVO 3',
            status: 'INVALID',
            reason: 'Dado inválido no cadastro',
          },
          {
            code: 'NOVO 4',
            status: 'INVALID',
            reason: 'O código é obrigatório',
          },
        ],
      });
    });

    it('item já cadastrado é ignorado antes da validação, como na prévia', async () => {
      const target = fakeTarget(['EXISTENTE']);
      target.validate.mockResolvedValue(['defeito qualquer']);
      const useCases = new CatalogImportUseCases(
        fakeReader({}),
        targetsWith('conductor-cables', target),
      );
      const result = await useCases.commit(
        {
          catalogKey: 'conductor-cables',
          effectiveFrom: '2026-01-01',
          items: [{ code: 'existente', weightTonPerKm: 'abc' }],
        },
        'sistema',
      );
      expect(result.rows).toEqual([
        { code: 'existente', status: 'SKIPPED_EXISTING', reason: null },
      ]);
      expect(target.validate).not.toHaveBeenCalled();
    });

    it(`mais de ${MAX_IMPORT_ROWS} itens no commit é rejeitado antes de gravar`, async () => {
      const target = fakeTarget();
      const useCases = new CatalogImportUseCases(
        fakeReader({}),
        targetsWith('conductor-cables', target),
      );
      await expect(
        useCases.commit(
          {
            catalogKey: 'conductor-cables',
            effectiveFrom: '2026-01-01',
            items: Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => ({
              code: `C${i}`,
            })),
          },
          'sistema',
        ),
      ).rejects.toThrow(
        new InvalidImportRequestException(
          'A importação aceita no máximo 5000 linhas por vez',
        ),
      );
      expect(target.create).not.toHaveBeenCalled();
    });

    it('descarta chaves fora do registro antes de validar e gravar', async () => {
      const target = fakeTarget();
      const useCases = new CatalogImportUseCases(
        fakeReader({}),
        targetsWith('conductor-cables', target),
      );
      await useCases.commit(
        {
          catalogKey: 'conductor-cables',
          effectiveFrom: '2026-01-01',
          items: [{ code: 'X', id: 99, createdBy: 'hacker' }],
        },
        'sistema',
      );
      expect(target.validate).toHaveBeenCalledWith({ code: 'X' });
      expect(target.create).toHaveBeenCalledWith(
        { code: 'X' },
        '2026-01-01',
        'sistema',
      );
    });

    it('código repetido no mesmo commit grava uma vez e ignora a repetição', async () => {
      const target = fakeTarget();
      const useCases = new CatalogImportUseCases(
        fakeReader({}),
        targetsWith('conductor-cables', target),
      );
      const result = await useCases.commit(
        {
          catalogKey: 'conductor-cables',
          effectiveFrom: '2026-01-01',
          items: [{ code: 'A' }, { code: ' a ' }],
        },
        'sistema',
      );
      expect(target.create).toHaveBeenCalledTimes(1);
      expect(result.rows.map((r) => r.status)).toEqual([
        'IMPORTED',
        'SKIPPED_EXISTING',
      ]);
    });

    it('erro inesperado de infraestrutura não é mascarado como linha inválida', async () => {
      const target = fakeTarget();
      target.create.mockRejectedValue(new Error('conexão perdida'));
      const useCases = new CatalogImportUseCases(
        fakeReader({}),
        targetsWith('conductor-cables', target),
      );
      await expect(
        useCases.commit(
          {
            catalogKey: 'conductor-cables',
            effectiveFrom: '2026-01-01',
            items: [{ code: 'A' }],
          },
          'sistema',
        ),
      ).rejects.toThrow('conexão perdida');
    });

    it('vigência inexistente é rejeitada antes de gravar', async () => {
      const target = fakeTarget();
      const useCases = new CatalogImportUseCases(
        fakeReader({}),
        targetsWith('conductor-cables', target),
      );
      await expect(
        useCases.commit(
          {
            catalogKey: 'conductor-cables',
            effectiveFrom: '2027-02-30',
            items: [{ code: 'A' }],
          },
          'sistema',
        ),
      ).rejects.toThrow(InvalidCivilDateException);
      expect(target.create).not.toHaveBeenCalled();
    });
  });
});
