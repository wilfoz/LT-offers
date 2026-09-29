import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../app/prisma.service';
import {
  ViabilityOfferQueryPort,
  ViabilityRevisionFinancials,
} from '../../domain/ports/viability-offer-query.port';

@Injectable()
export class PrismaViabilityOfferQueryAdapter implements ViabilityOfferQueryPort {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async findRevisionFinancials(
    offerId: number,
    revisionId: number,
  ): Promise<ViabilityRevisionFinancials | null> {
    const row = await this.prisma.offerRevision.findFirst({
      where: { id: revisionId, offerId },
      select: {
        offerDate: true,
        bidderCapex: true,
        estimatedCapex: true,
        maxRap: true,
        winningRap: true,
        auctionNumber: true,
      },
    });
    if (!row) return null;

    return {
      offerDate: row.offerDate.toISOString().slice(0, 10),
      bidderCapex: row.bidderCapex ? row.bidderCapex.toFixed(2) : null,
      estimatedCapex: row.estimatedCapex ? row.estimatedCapex.toFixed(2) : null,
      maxRap: row.maxRap ? row.maxRap.toFixed(2) : null,
      winningRap: row.winningRap ? row.winningRap.toFixed(2) : null,
      auctionNumber: row.auctionNumber,
    };
  }
}
