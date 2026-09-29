import {
  AneelDatasetInvalidException,
  AneelSourceUnavailableException,
} from '../../domain/exceptions/auction-history.exceptions';
import { CkanAneelAuctionResultsAdapter } from './ckan-aneel-auction-results.adapter';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('CkanAneelAuctionResultsAdapter — fonte externa (sem rede)', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('pagina por offset até acumular o total informado', async () => {
    const page = (records: unknown[]) =>
      jsonResponse({ success: true, result: { total: 700, records } });
    fetchMock
      .mockResolvedValueOnce(page(new Array(500).fill({ NumLeilao: '1/2020' })))
      .mockResolvedValueOnce(
        page(new Array(200).fill({ NumLeilao: '1/2020' })),
      );

    const { source, records } =
      await new CkanAneelAuctionResultsAdapter().fetchAll();

    expect(records).toHaveLength(700);
    expect(source).toContain('453cb742-8089-4c16-aaf2-42088b5553dc');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain('offset=0');
    expect(String(fetchMock.mock.calls[1][0])).toContain('offset=500');
  });

  it('HTTP fora de 2xx vira fonte indisponível com mensagem em português', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, false, 503));

    await expect(
      new CkanAneelAuctionResultsAdapter().fetchAll(),
    ).rejects.toThrow(
      'Fonte de dados da ANEEL indisponível: o datastore respondeu HTTP 503. O snapshot local permanece inalterado.',
    );
  });

  it('falha de rede vira fonte indisponível', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

    await expect(
      new CkanAneelAuctionResultsAdapter().fetchAll(),
    ).rejects.toThrow(AneelSourceUnavailableException);
  });

  it('corpo que não é JSON vira resposta fora do esquema', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    } as unknown as Response);

    await expect(
      new CkanAneelAuctionResultsAdapter().fetchAll(),
    ).rejects.toThrow(AneelDatasetInvalidException);
  });

  it('resposta sem success/result vira fora do esquema', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false }));

    await expect(
      new CkanAneelAuctionResultsAdapter().fetchAll(),
    ).rejects.toThrow(
      'Resposta da ANEEL fora do esquema esperado: a resposta não contém success/result.total/result.records. A sincronização foi abortada e o snapshot local permanece inalterado.',
    );
  });

  it('estourar o freio de páginas aborta em vez de devolver snapshot truncado', async () => {
    // Toda página devolve 500 registros e um total inalcançável: o adapter
    // precisa falhar, nunca retornar sucesso parcial (cenário do spec).
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        result: { total: 999999, records: new Array(500).fill({}) },
      }),
    );

    await expect(
      new CkanAneelAuctionResultsAdapter().fetchAll(),
    ).rejects.toThrow(
      'a paginação excedeu 50 páginas sem alcançar o total informado',
    );
    expect(fetchMock).toHaveBeenCalledTimes(50);
  });

  it('timeout do AbortController vira fonte indisponível citando o tempo limite', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    fetchMock.mockRejectedValueOnce(abortError);

    await expect(
      new CkanAneelAuctionResultsAdapter().fetchAll(),
    ).rejects.toThrow('tempo limite de 15s excedido');
  });
});
