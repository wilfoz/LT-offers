import { Test } from '@nestjs/testing';
import { BadGatewayException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  GetAuctionBenchmarkUseCase,
  ListAuctionResultsUseCase,
  SyncAuctionResultsUseCase,
} from '../../application/usecases';
import { AneelSourceUnavailableException } from '../../domain/exceptions/auction-history.exceptions';
import {
  AuctionBenchmarkQueryDto,
  ListAuctionResultsQueryDto,
} from '../dto/auction-history-query.dto';
import { AuctionHistoryController } from './auction-history.controller';

describe('AuctionHistoryController', () => {
  const syncMock = { execute: jest.fn() };
  const listMock = {
    execute: jest.fn().mockResolvedValue({ results: [], lastImport: null }),
  };
  const benchmarkMock = {
    execute: jest.fn().mockResolvedValue({
      lotResult: null,
      auctionStats: null,
      overallStats: {
        lotCount: 0,
        desertedLotCount: 0,
        minDiscountPercent: null,
        avgDiscountPercent: null,
        maxDiscountPercent: null,
      },
      lastImport: null,
    }),
  };

  let controller: AuctionHistoryController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AuctionHistoryController],
      providers: [
        { provide: SyncAuctionResultsUseCase, useValue: syncMock },
        { provide: ListAuctionResultsUseCase, useValue: listMock },
        { provide: GetAuctionBenchmarkUseCase, useValue: benchmarkMock },
      ],
    }).compile();
    controller = moduleRef.get(AuctionHistoryController);
  });

  it('sync delega com o autor do cabeçalho X-User e fallback "sistema"', async () => {
    syncMock.execute.mockResolvedValue({
      id: 1,
      source: 'ckan://x',
      rowCount: 488,
      importedBy: 'qa@epc.com',
      importedAt: '2026-09-29T00:00:00.000Z',
    });

    await controller.sync('qa@epc.com');
    expect(syncMock.execute).toHaveBeenCalledWith('qa@epc.com');

    await controller.sync(undefined);
    expect(syncMock.execute).toHaveBeenCalledWith('sistema');
  });

  it('falha da fonte externa vira 502 com a mensagem em português preservada', async () => {
    syncMock.execute.mockRejectedValue(
      new AneelSourceUnavailableException('tempo limite de 15s excedido'),
    );

    await expect(controller.sync('qa@epc.com')).rejects.toThrow(
      BadGatewayException,
    );
    await expect(controller.sync('qa@epc.com')).rejects.toThrow(
      'Fonte de dados da ANEEL indisponível: tempo limite de 15s excedido. O snapshot local permanece inalterado.',
    );
  });

  it('list converte ano para número, UF para maiúsculas e repassa os filtros', async () => {
    const query = plainToInstance(ListAuctionResultsQueryDto, {
      search: 'exemplo',
      auctionNumber: '002/2024',
      uf: 'mg',
      year: '2024',
    });
    await controller.list(query);

    expect(listMock.execute).toHaveBeenCalledWith({
      search: 'exemplo',
      auctionNumber: '002/2024',
      uf: 'MG',
      year: 2024,
    });
  });

  it('benchmark converte o lote para número e delega a identidade', async () => {
    const query = plainToInstance(AuctionBenchmarkQueryDto, {
      auctionNumber: '004/2026',
      lotNumber: '4',
    });
    await controller.benchmark(query);

    expect(benchmarkMock.execute).toHaveBeenCalledWith('004/2026', 4);
  });

  describe('Validação dos query DTOs (mensagens em português)', () => {
    it('list: número do leilão fora do formato e ano sem quatro dígitos', async () => {
      const dto = plainToInstance(ListAuctionResultsQueryDto, {
        auctionNumber: '2-2024',
        uf: 'Minas',
        year: '24',
      });
      const errors = await validate(dto);
      const byField = Object.fromEntries(
        errors.map((error) => [error.property, error.constraints]),
      );
      expect(byField['auctionNumber']?.['matches']).toBe(
        'O número do leilão deve estar no formato NNN/AAAA (ex.: 002/2024)',
      );
      expect(byField['uf']?.['matches']).toBe(
        'A UF deve ser a sigla de duas letras (ex.: MG)',
      );
      expect(byField['year']?.['matches']).toBe(
        'O ano do leilão deve ter quatro dígitos (ex.: 2024)',
      );
    });

    it('benchmark: identidade obrigatória e lote inteiro maior ou igual a 1', async () => {
      const missing = await validate(
        plainToInstance(AuctionBenchmarkQueryDto, {}),
      );
      expect(missing.map((error) => error.property).sort()).toEqual([
        'auctionNumber',
        'lotNumber',
      ]);

      const invalidLot = await validate(
        plainToInstance(AuctionBenchmarkQueryDto, {
          auctionNumber: '004/2026',
          lotNumber: '0',
        }),
      );
      expect(invalidLot[0]?.constraints?.['matches']).toBe(
        'O número do lote deve ser um número inteiro maior ou igual a 1',
      );
    });

    it('paridade DTO × contrato: todas as chaves inválidas geram 1 erro por campo', async () => {
      const dto = plainToInstance(ListAuctionResultsQueryDto, {
        search: 'x'.repeat(121),
        auctionNumber: '2024/002-extra',
        uf: 'M',
        year: 'ano',
      });
      const errors = await validate(dto);
      expect(errors.map((error) => error.property).sort()).toEqual([
        'auctionNumber',
        'search',
        'uf',
        'year',
      ]);
    });
  });
});
