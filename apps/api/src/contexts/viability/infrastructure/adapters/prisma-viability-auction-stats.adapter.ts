import { Inject, Injectable } from '@nestjs/common';
import { AuctionResultItem } from '@lt-offers/domain';
import { PrismaService } from '../../../../app/prisma.service';
import { ViabilityAuctionStatsPort } from '../../domain/ports/viability-auction-stats.port';

type DiscountRow = Pick<AuctionResultItem, 'discountPercent' | 'winnerName'>;

/**
 * Leitura direta do snapshot `auction_result` (RNF-04) — porta própria para
 * não acoplar o módulo auction-history (design D3).
 */
@Injectable()
export class PrismaViabilityAuctionStatsAdapter implements ViabilityAuctionStatsPort {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async findByAuction(auctionNumber: string): Promise<DiscountRow[]> {
    const rows = await this.prisma.auctionResult.findMany({
      where: { auctionNumber },
      select: { discountPercent: true, winnerName: true },
    });
    return rows.map(toDiscountRow);
  }

  async findDiscountRows(): Promise<DiscountRow[]> {
    const rows = await this.prisma.auctionResult.findMany({
      select: { discountPercent: true, winnerName: true },
    });
    return rows.map(toDiscountRow);
  }
}

function toDiscountRow(row: {
  discountPercent: { toFixed(dp: number): string } | null;
  winnerName: string | null;
}): DiscountRow {
  return {
    discountPercent: row.discountPercent
      ? row.discountPercent.toFixed(2)
      : null,
    winnerName: row.winnerName,
  };
}
