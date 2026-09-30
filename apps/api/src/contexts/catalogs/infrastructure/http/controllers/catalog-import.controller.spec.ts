import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CatalogImportUseCases } from '../../../application';
import {
  CatalogImportTarget,
  CatalogImportTargets,
  SpreadsheetReader,
} from '../../../domain';
import { CatalogImportCommitDto } from '../dto/catalog-import.dto';
import {
  CatalogImportController,
  FILE_TOO_LARGE_MESSAGE,
  ImportUploadExceptionFilter,
} from './catalog-import.controller';

const ROWS = [
  ['Código', 'Peso'],
  ['C1', 0.5],
];

const reader: SpreadsheetReader = {
  listSheets: () => [
    {
      name: 'DB_CAL',
      rowCount: 2,
      row: (i) => ROWS[i],
      rowText: (i) => ROWS[i].map(String),
    },
  ],
  readSheet: (_b, _f, name) =>
    name === 'DB_CAL'
      ? {
          name,
          rowCount: 2,
          row: (i) => ROWS[i],
          rowText: (i) => ROWS[i].map(String),
        }
      : null,
};

function target(): jest.Mocked<CatalogImportTarget> {
  return {
    listCodes: jest.fn().mockResolvedValue([]),
    validate: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue(undefined),
  };
}

const FILE = { originalname: 'Calculo LT.xlsm', buffer: Buffer.from('x') };

const OPTIONS = {
  catalogKey: 'conductor-cables',
  sheetName: 'DB_CAL',
  headerRow: 1,
  columns: { code: 0, weightTonPerKm: 1 },
  fixedValues: {},
  effectiveFrom: '2026-01-01',
};

/** Mensagem do corpo da resposta HTTP de uma exceção do Nest. */
async function responseMessage(action: () => unknown): Promise<unknown> {
  try {
    await action();
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return ((error as HttpException).getResponse() as { message: unknown })
      .message;
  }
  throw new Error('era esperada uma exceção');
}

describe('CatalogImportController', () => {
  let conductorTarget: jest.Mocked<CatalogImportTarget>;
  let controller: CatalogImportController;

  beforeEach(() => {
    conductorTarget = target();
    const targets = {
      'conductor-cables': conductorTarget,
      'ground-wires': target(),
    } as unknown as CatalogImportTargets;
    controller = new CatalogImportController(
      new CatalogImportUseCases(reader, targets),
    );
  });

  describe('inspect', () => {
    it('sem arquivo → 400 em português', async () => {
      await expect(responseMessage(() => controller.inspect())).resolves.toBe(
        'Nenhum arquivo foi enviado; selecione uma planilha .xlsx, .xlsm, .xls ou .csv',
      );
    });

    it('arquivo que não é planilha → 400 listando os formatos aceitos', async () => {
      await expect(
        responseMessage(() =>
          controller.inspect({
            originalname: 'projeto.pdf',
            buffer: Buffer.from('%PDF'),
          }),
        ),
      ).resolves.toBe(
        'Formato de arquivo não suportado; envie uma planilha .xlsx, .xlsm, .xls ou .csv',
      );
    });

    it('devolve as abas do arquivo', () => {
      expect(controller.inspect(FILE)).toEqual({
        fileName: 'Calculo LT.xlsm',
        sheets: [
          {
            name: 'DB_CAL',
            rows: [
              ['Código', 'Peso'],
              ['C1', '0.5'],
            ],
          },
        ],
      });
    });
  });

  describe('preview', () => {
    it('opções ausentes ou fora de JSON → 400 orientando o formato', async () => {
      const expected =
        'Envie as opções da prévia (catálogo, aba, cabeçalho, mapeamento e vigência) em JSON no campo "options"';
      for (const options of [undefined, '{nao-json', '[]', '"texto"']) {
        await expect(
          responseMessage(() => controller.preview(FILE, options)),
        ).resolves.toBe(expected);
      }
    });

    it('opções com formato inválido → 400 com as mensagens do DTO', async () => {
      await expect(
        responseMessage(() =>
          controller.preview(
            FILE,
            JSON.stringify({
              ...OPTIONS,
              catalogKey: 'structure-series',
              headerRow: 0,
              columns: { code: -1 },
            }),
          ),
        ),
      ).resolves.toEqual([
        'Catálogo de destino inválido para importação',
        'A linha de cabeçalho deve ser um número inteiro maior ou igual a 1',
        'O mapeamento de colunas deve associar cada campo a um índice de coluna (inteiro maior ou igual a 0)',
      ]);
    });

    it('campo requerido sem coluna nem valor fixo → 400 com orientação', async () => {
      await expect(
        responseMessage(() =>
          controller.preview(
            FILE,
            JSON.stringify({
              ...OPTIONS,
              catalogKey: 'ground-wires',
              columns: { code: 0 },
            }),
          ),
        ),
      ).resolves.toBe(
        'O campo Tipo é requerido: associe uma coluna do arquivo ou informe um valor fixo',
      );
    });

    it('vigência inexistente (2027-02-30) → 400', async () => {
      await expect(
        responseMessage(() =>
          controller.preview(
            FILE,
            JSON.stringify({ ...OPTIONS, effectiveFrom: '2027-02-30' }),
          ),
        ),
      ).resolves.toBe(
        'Data inválida: "2027-02-30"; informe uma data real no formato AAAA-MM-DD',
      );
    });

    it('devolve a prévia classificada', async () => {
      const result = await controller.preview(FILE, JSON.stringify(OPTIONS));
      expect(result.rows).toEqual([
        {
          rowNumber: 2,
          code: 'C1',
          status: 'TO_IMPORT',
          reasons: [],
          payload: {
            code: 'C1',
            description: null,
            weightTonPerKm: '0.5',
            reelLengthM: null,
            diameterMm: null,
            utsKn: null,
          },
        },
      ]);
    });
  });

  describe('commit', () => {
    const dto = {
      catalogKey: 'conductor-cables' as const,
      effectiveFrom: '2026-01-01',
      items: [{ code: 'C1' }],
    };

    it('grava com o autor do header X-User e cai para "sistema" sem ele', async () => {
      await controller.commit(dto, 'maria');
      expect(conductorTarget.create).toHaveBeenLastCalledWith(
        { code: 'C1' },
        '2026-01-01',
        'maria',
      );
      conductorTarget.listCodes.mockResolvedValue([]);
      await controller.commit(dto, undefined);
      expect(conductorTarget.create).toHaveBeenLastCalledWith(
        { code: 'C1' },
        '2026-01-01',
        'sistema',
      );
    });

    it('vigência inexistente → 400', async () => {
      await expect(
        responseMessage(() =>
          controller.commit({ ...dto, effectiveFrom: '2027-02-30' }, 'maria'),
        ),
      ).resolves.toBe(
        'Data inválida: "2027-02-30"; informe uma data real no formato AAAA-MM-DD',
      );
    });

    it('o DTO do commit limita a 5000 itens por vez', async () => {
      const errors = await validate(
        plainToInstance(CatalogImportCommitDto, {
          ...dto,
          items: Array.from({ length: 5001 }, () => ({ code: 'X' })),
        }),
      );
      expect(errors.flatMap((e) => Object.values(e.constraints ?? {}))).toEqual(
        ['A importação aceita no máximo 5000 itens por vez'],
      );
    });

    it('o DTO do commit reprova formato de data, catálogo e itens com mensagens em português', async () => {
      const errors = await validate(
        plainToInstance(CatalogImportCommitDto, {
          catalogKey: 'work-crews',
          effectiveFrom: '01/01/2026',
          items: [1],
        }),
      );
      expect(errors.flatMap((e) => Object.values(e.constraints ?? {}))).toEqual(
        [
          'Catálogo de destino inválido para importação',
          'A data de início de vigência deve estar no formato AAAA-MM-DD',
          'Cada item da importação deve ser um objeto',
        ],
      );
    });
  });

  it('erro de campo do multer (em inglês) vira pt-BR; demais 400 passam intactos', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;
    const filter = new ImportUploadExceptionFilter();

    filter.catch(new BadRequestException('Unexpected field'), host);
    expect(json).toHaveBeenLastCalledWith({
      statusCode: 400,
      message:
        'Envie uma única planilha no campo "file" e as opções no campo "options"',
      error: 'Bad Request',
    });

    const own = new BadRequestException('Informe a aba da planilha');
    filter.catch(own, host);
    expect(json).toHaveBeenLastCalledWith(own.getResponse());
    expect(status).toHaveBeenCalledWith(400);
  });

  it('arquivo acima de 40 MB → 413 com mensagem em português', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    new ImportUploadExceptionFilter().catch(
      new PayloadTooLargeException('File too large'),
      host,
    );

    expect(status).toHaveBeenCalledWith(413);
    expect(json).toHaveBeenCalledWith({
      statusCode: 413,
      message: FILE_TOO_LARGE_MESSAGE,
      error: 'Payload Too Large',
    });
    expect(FILE_TOO_LARGE_MESSAGE).toBe(
      'O arquivo excede o limite de 40 MB para importação',
    );
  });
});
