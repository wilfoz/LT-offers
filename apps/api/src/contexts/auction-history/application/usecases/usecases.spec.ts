import {
  AuctionResultImportItem,
  AuctionResultItem,
  RawAuctionResultRecord,
} from '@lt-offers/domain';
import {
  AneelDatasetInvalidException,
  AneelSourceUnavailableException,
} from '../../domain/exceptions/auction-history.exceptions';
import { AneelAuctionResultsPort } from '../../domain/ports/aneel-auction-results.port';
import {
  AuctionHistoryRepository,
  AuctionResultsFilter,
} from '../../domain/ports/auction-history.repository';
import { GetAuctionBenchmarkUseCase } from './get-auction-benchmark.usecase';
import { ListAuctionResultsUseCase } from './list-auction-results.usecase';
import { SyncAuctionResultsUseCase } from './sync-auction-results.usecase';

/** Registro cru com as armadilhas reais do dataset (vírgula, fração). */
const rawWinnerLot: RawAuctionResultRecord = {
  AnoLeilao: 2024,
  DatLeilao: '2024-09-27T00:00:00',
  NumLeilao: '2/2024',
  NumLoteLeilao: 7,
  NomEmpreendimento: 'LT 500 kV Exemplo',
  SigUFPrincipal: 'CE/PI',
  QtdPrazoConstrucaoMeses: 60,
  MdaExtensaoLinhaTransmissaoKm: '380,5',
  VlrInvestimentoPrevisto: '2.933.612.926,94',
  VlrRAPEditalLeilao: '762630000,00',
  NomVencedorLeilao: 'Transmissora Exemplo S.A.',
  VlrRAPVencedorLeilao: '381315000,00',
  PctDesagio: '0,48',
};

const rawDesertedLot: RawAuctionResultRecord = {
  AnoLeilao: 2024,
  NumLeilao: '002/2024',
  NumLoteLeilao: 8,
  NomEmpreendimento: 'LT 230 kV Deserta',
  NomVencedorLeilao: '',
  PctDesagio: '0',
};

class InMemoryAuctionHistoryRepository implements AuctionHistoryRepository {
  snapshot: AuctionResultItem[] = [];
  imports: AuctionResultImportItem[] = [];

  async replaceSnapshot(
    items: AuctionResultItem[],
    meta: { source: string; importedBy: string },
  ): Promise<AuctionResultImportItem> {
    this.snapshot = [...items];
    const importItem: AuctionResultImportItem = {
      id: this.imports.length + 1,
      source: meta.source,
      rowCount: items.length,
      importedBy: meta.importedBy,
      importedAt: '2026-09-29T00:00:00.000Z',
    };
    this.imports.push(importItem);
    return importItem;
  }

  async findResults(
    filter: AuctionResultsFilter,
  ): Promise<AuctionResultItem[]> {
    return this.snapshot.filter(
      (item) =>
        (filter.auctionNumber === undefined ||
          item.auctionNumber === filter.auctionNumber) &&
        (filter.year === undefined || item.auctionYear === filter.year),
    );
  }

  async findLotResult(
    auctionNumber: string,
    lotNumber: number,
  ): Promise<AuctionResultItem | null> {
    return (
      this.snapshot.find(
        (item) =>
          item.auctionNumber === auctionNumber && item.lotNumber === lotNumber,
      ) ?? null
    );
  }

  async findByAuction(auctionNumber: string): Promise<AuctionResultItem[]> {
    return this.snapshot.filter((item) => item.auctionNumber === auctionNumber);
  }

  async findDiscountRows(): Promise<
    Pick<AuctionResultItem, 'discountPercent' | 'winnerName'>[]
  > {
    return this.snapshot.map((item) => ({
      discountPercent: item.discountPercent,
      winnerName: item.winnerName,
    }));
  }

  async findLastImport(): Promise<AuctionResultImportItem | null> {
    return this.imports[this.imports.length - 1] ?? null;
  }
}

function sourceWith(
  records: RawAuctionResultRecord[],
): AneelAuctionResultsPort {
  return {
    fetchAll: jest.fn().mockResolvedValue({ source: 'ckan://teste', records }),
  };
}

describe('Contexto auction-history — casos de uso (RF-11, RNF-04, RNF-09)', () => {
  let repository: InMemoryAuctionHistoryRepository;
  let auditTrail: { logEvent: jest.Mock };

  beforeEach(() => {
    repository = new InMemoryAuctionHistoryRepository();
    auditTrail = { logEvent: jest.fn() };
  });

  describe('SyncAuctionResultsUseCase', () => {
    it('normaliza fim a fim (vírgula, fração, deserto), substitui o snapshot e audita a contagem', async () => {
      const useCase = new SyncAuctionResultsUseCase(
        sourceWith([rawWinnerLot, rawDesertedLot]),
        repository,
        auditTrail,
      );

      const importItem = await useCase.execute('qa@epc.com');

      expect(importItem.rowCount).toBe(2);
      expect(importItem.source).toBe('ckan://teste');
      expect(repository.snapshot).toHaveLength(2);
      expect(repository.snapshot[0]).toMatchObject({
        auctionNumber: '002/2024',
        lotNumber: 7,
        estimatedInvestment: '2933612926.94',
        discountPercent: '48.00',
      });
      expect(repository.snapshot[1]).toMatchObject({
        lotNumber: 8,
        winnerName: null,
        winningRap: null,
        discountPercent: null,
      });
      expect(auditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: 'AUCTION_HISTORY',
          action: 'CREATE',
          description:
            'Sincronização do histórico de leilões da ANEEL: 2 lotes importados',
        }),
      );
    });

    it('registro sem identidade mínima aborta sem tocar o snapshot nem registrar importação', async () => {
      await new SyncAuctionResultsUseCase(
        sourceWith([rawWinnerLot]),
        repository,
      ).execute('seed');
      const before = [...repository.snapshot];

      const useCase = new SyncAuctionResultsUseCase(
        sourceWith([
          rawWinnerLot,
          { ...rawDesertedLot, NumLeilao: 'inválido' },
        ]),
        repository,
        auditTrail,
      );

      await expect(useCase.execute('qa@epc.com')).rejects.toThrow(
        'Resposta da ANEEL fora do esquema esperado: 1 registro(s) sem identidade mínima (ano, número do leilão, lote e empreendimento). A sincronização foi abortada e o snapshot local permanece inalterado.',
      );
      expect(repository.snapshot).toEqual(before);
      expect(repository.imports).toHaveLength(1);
      expect(auditTrail.logEvent).not.toHaveBeenCalled();
    });

    it('dataset vazio aborta com mensagem em português', async () => {
      const useCase = new SyncAuctionResultsUseCase(sourceWith([]), repository);
      await expect(useCase.execute('qa@epc.com')).rejects.toThrow(
        AneelDatasetInvalidException,
      );
      expect(repository.imports).toHaveLength(0);
    });

    it('deságio fora do intervalo 0–100% aborta antes de escrever (guarda da coluna DECIMAL(5,2))', async () => {
      const useCase = new SyncAuctionResultsUseCase(
        // "48" publicado por engano já em percentual viraria 4800.00.
        sourceWith([{ ...rawWinnerLot, PctDesagio: '48' }]),
        repository,
        auditTrail,
      );
      await expect(useCase.execute('qa@epc.com')).rejects.toThrow(
        '1 registro(s) com deságio fora do intervalo de 0 a 100%',
      );
      expect(repository.snapshot).toHaveLength(0);
      expect(auditTrail.logEvent).not.toHaveBeenCalled();
    });

    it('falha da fonte propaga sem alterar o snapshot vigente', async () => {
      await new SyncAuctionResultsUseCase(
        sourceWith([rawWinnerLot]),
        repository,
      ).execute('seed');
      const before = [...repository.snapshot];

      const failingSource: AneelAuctionResultsPort = {
        fetchAll: jest
          .fn()
          .mockRejectedValue(
            new AneelSourceUnavailableException('falha de rede simulada'),
          ),
      };
      const useCase = new SyncAuctionResultsUseCase(
        failingSource,
        repository,
        auditTrail,
      );

      await expect(useCase.execute('qa@epc.com')).rejects.toThrow(
        AneelSourceUnavailableException,
      );
      expect(repository.snapshot).toEqual(before);
      expect(repository.imports).toHaveLength(1);
    });
  });

  describe('ListAuctionResultsUseCase', () => {
    it('devolve o snapshot filtrado e os metadados da última importação', async () => {
      await new SyncAuctionResultsUseCase(
        sourceWith([rawWinnerLot, rawDesertedLot]),
        repository,
      ).execute('seed');

      const listing = await new ListAuctionResultsUseCase(repository).execute({
        auctionNumber: '002/2024',
      });

      expect(listing.results).toHaveLength(2);
      expect(listing.lastImport?.rowCount).toBe(2);
      expect(listing.lastImport?.importedBy).toBe('seed');
    });
  });

  describe('GetAuctionBenchmarkUseCase', () => {
    beforeEach(async () => {
      await new SyncAuctionResultsUseCase(
        sourceWith([
          rawWinnerLot,
          rawDesertedLot,
          {
            ...rawWinnerLot,
            NumLeilao: '001/2026',
            NumLoteLeilao: 1,
            AnoLeilao: 2026,
            NomEmpreendimento: 'LT 500 kV Outro Leilão',
            PctDesagio: '0,3789',
          },
        ]),
        repository,
      ).execute('seed');
    });

    it('lote presente: resultado oficial + estatísticas do leilão e da base', async () => {
      const useCase = new GetAuctionBenchmarkUseCase(repository);
      const response = await useCase.execute('002/2024', 7);

      expect(response.lotResult?.winnerName).toBe('Transmissora Exemplo S.A.');
      expect(response.lotResult?.discountPercent).toBe('48.00');
      expect(response.auctionStats).toEqual({
        lotCount: 2,
        desertedLotCount: 1,
        minDiscountPercent: '48.00',
        avgDiscountPercent: '48.00',
        maxDiscountPercent: '48.00',
      });
      expect(response.overallStats).toEqual({
        lotCount: 3,
        desertedLotCount: 1,
        minDiscountPercent: '37.89',
        avgDiscountPercent: '42.95',
        maxDiscountPercent: '48.00',
      });
      expect(response.lastImport?.importedBy).toBe('seed');
    });

    it('leilão sem resultado publicado: lote e estatísticas do leilão nulos, base preservada', async () => {
      const response = await new GetAuctionBenchmarkUseCase(repository).execute(
        '004/2026',
        4,
      );

      expect(response.lotResult).toBeNull();
      expect(response.auctionStats).toBeNull();
      expect(response.overallStats.lotCount).toBe(3);
    });

    it('base vazia: tudo nulo com contagens zero, nunca valores inventados', async () => {
      const emptyRepository = new InMemoryAuctionHistoryRepository();
      const response = await new GetAuctionBenchmarkUseCase(
        emptyRepository,
      ).execute('002/2024', 7);

      expect(response.lotResult).toBeNull();
      expect(response.auctionStats).toBeNull();
      expect(response.overallStats).toEqual({
        lotCount: 0,
        desertedLotCount: 0,
        minDiscountPercent: null,
        avgDiscountPercent: null,
        maxDiscountPercent: null,
      });
      expect(response.lastImport).toBeNull();
    });
  });
});
