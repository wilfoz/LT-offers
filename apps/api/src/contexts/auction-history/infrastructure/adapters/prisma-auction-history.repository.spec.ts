import { PrismaService } from '../../../../app/prisma.service';
import { PrismaAuctionHistoryRepository } from './prisma-auction-history.repository';

describe('PrismaAuctionHistoryRepository — filtros da consulta', () => {
  const findMany = jest.fn().mockResolvedValue([]);
  const prisma = {
    auctionResult: { findMany },
  } as unknown as PrismaService;

  beforeEach(() => {
    findMany.mockClear();
  });

  it('monta o where completo com busca, leilão, UF e ano (igualdade total)', async () => {
    const repository = new PrismaAuctionHistoryRepository(prisma);
    await repository.findResults({
      search: ' Exemplo ',
      auctionNumber: '002/2024',
      uf: 'MG',
      year: 2024,
    });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { projectName: { contains: 'Exemplo', mode: 'insensitive' } },
          { winnerName: { contains: 'Exemplo', mode: 'insensitive' } },
        ],
        auctionNumber: '002/2024',
        mainUf: { contains: 'MG', mode: 'insensitive' },
        auctionYear: 2024,
      },
      orderBy: [
        { auctionYear: 'desc' },
        { auctionNumber: 'desc' },
        { lotNumber: 'asc' },
      ],
    });
  });

  it('sem filtros, o where é vazio e a ordenação é preservada', async () => {
    const repository = new PrismaAuctionHistoryRepository(prisma);
    await repository.findResults({});

    expect(findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [
        { auctionYear: 'desc' },
        { auctionNumber: 'desc' },
        { lotNumber: 'asc' },
      ],
    });
  });
});
