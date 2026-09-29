import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuctionResultImportItem, AuctionResultItem } from '@lt-offers/domain';
import { PrismaService } from '../../../../app/prisma.service';
import {
  AuctionHistoryRepository,
  AuctionResultsFilter,
} from '../../domain/ports/auction-history.repository';

const Decimal = Prisma.Decimal;

type ImportRow = Prisma.AuctionResultImportGetPayload<Record<string, never>>;
type ResultRow = Prisma.AuctionResultGetPayload<Record<string, never>>;

@Injectable()
export class PrismaAuctionHistoryRepository implements AuctionHistoryRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async replaceSnapshot(
    items: AuctionResultItem[],
    meta: { source: string; importedBy: string },
  ): Promise<AuctionResultImportItem> {
    // Substituição atômica (design D1): apaga o snapshot, registra a
    // importação e insere as linhas novas — o log de importações é imutável.
    const created = await this.prisma.$transaction(async (tx) => {
      await tx.auctionResult.deleteMany({});
      const importRow = await tx.auctionResultImport.create({
        data: {
          source: meta.source,
          rowCount: items.length,
          importedBy: meta.importedBy,
        },
      });
      await tx.auctionResult.createMany({
        data: items.map((item) => ({
          importId: importRow.id,
          auctionYear: item.auctionYear,
          auctionDate: item.auctionDate ? new Date(item.auctionDate) : null,
          auctionNumber: item.auctionNumber,
          lotNumber: item.lotNumber,
          projectName: item.projectName,
          mainUf: item.mainUf,
          constructionDeadlineMonths: item.constructionDeadlineMonths,
          lineLengthKm:
            item.lineLengthKm !== null ? new Decimal(item.lineLengthKm) : null,
          substationMva:
            item.substationMva !== null
              ? new Decimal(item.substationMva)
              : null,
          estimatedInvestment:
            item.estimatedInvestment !== null
              ? new Decimal(item.estimatedInvestment)
              : null,
          maxRap: item.maxRap !== null ? new Decimal(item.maxRap) : null,
          winnerName: item.winnerName,
          winningRap:
            item.winningRap !== null ? new Decimal(item.winningRap) : null,
          discountPercent:
            item.discountPercent !== null
              ? new Decimal(item.discountPercent)
              : null,
        })),
      });
      return importRow;
    });

    return toImportItem(created);
  }

  async findResults(
    filter: AuctionResultsFilter,
  ): Promise<AuctionResultItem[]> {
    const where: Prisma.AuctionResultWhereInput = {};
    const search = filter.search?.trim();
    if (search) {
      where.OR = [
        { projectName: { contains: search, mode: 'insensitive' } },
        { winnerName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (filter.auctionNumber) {
      where.auctionNumber = filter.auctionNumber;
    }
    if (filter.uf) {
      where.mainUf = { contains: filter.uf, mode: 'insensitive' };
    }
    if (filter.year !== undefined) {
      where.auctionYear = filter.year;
    }

    const rows = await this.prisma.auctionResult.findMany({
      where,
      orderBy: [
        { auctionYear: 'desc' },
        { auctionNumber: 'desc' },
        { lotNumber: 'asc' },
      ],
    });
    return rows.map(toResultItem);
  }

  async findLotResult(
    auctionNumber: string,
    lotNumber: number,
  ): Promise<AuctionResultItem | null> {
    const row = await this.prisma.auctionResult.findFirst({
      where: { auctionNumber, lotNumber },
      orderBy: { id: 'asc' },
    });
    return row ? toResultItem(row) : null;
  }

  async findByAuction(auctionNumber: string): Promise<AuctionResultItem[]> {
    const rows = await this.prisma.auctionResult.findMany({
      where: { auctionNumber },
      orderBy: { lotNumber: 'asc' },
    });
    return rows.map(toResultItem);
  }

  async findDiscountRows(): Promise<
    Pick<AuctionResultItem, 'discountPercent' | 'winnerName'>[]
  > {
    const rows = await this.prisma.auctionResult.findMany({
      select: { discountPercent: true, winnerName: true },
    });
    return rows.map((row) => ({
      discountPercent: row.discountPercent
        ? row.discountPercent.toFixed(2)
        : null,
      winnerName: row.winnerName,
    }));
  }

  async findLastImport(): Promise<AuctionResultImportItem | null> {
    const row = await this.prisma.auctionResultImport.findFirst({
      orderBy: { importedAt: 'desc' },
    });
    return row ? toImportItem(row) : null;
  }
}

function toImportItem(row: ImportRow): AuctionResultImportItem {
  return {
    id: row.id,
    source: row.source,
    rowCount: row.rowCount,
    importedBy: row.importedBy,
    importedAt: row.importedAt.toISOString(),
  };
}

function toResultItem(row: ResultRow): AuctionResultItem {
  return {
    id: row.id,
    auctionYear: row.auctionYear,
    auctionDate: row.auctionDate
      ? row.auctionDate.toISOString().slice(0, 10)
      : null,
    auctionNumber: row.auctionNumber,
    lotNumber: row.lotNumber,
    projectName: row.projectName,
    mainUf: row.mainUf,
    constructionDeadlineMonths: row.constructionDeadlineMonths,
    lineLengthKm: row.lineLengthKm ? row.lineLengthKm.toFixed(3) : null,
    substationMva: row.substationMva ? row.substationMva.toFixed(2) : null,
    estimatedInvestment: row.estimatedInvestment
      ? row.estimatedInvestment.toFixed(2)
      : null,
    maxRap: row.maxRap ? row.maxRap.toFixed(2) : null,
    winnerName: row.winnerName,
    winningRap: row.winningRap ? row.winningRap.toFixed(2) : null,
    discountPercent: row.discountPercent
      ? row.discountPercent.toFixed(2)
      : null,
  };
}
