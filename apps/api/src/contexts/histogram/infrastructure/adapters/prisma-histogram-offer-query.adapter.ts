import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../app/prisma.service';
import { HistogramOfferData, HistogramOfferQueryPort } from '../../domain';

@Injectable()
export class PrismaHistogramOfferQueryAdapter implements HistogramOfferQueryPort {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findOfferLines(offerId: number): Promise<HistogramOfferData | null> {
    const offer = await (this.prisma as any).offer.findUnique({
      where: { id: offerId },
      include: {
        revisions: {
          include: {
            transmissionLines: true,
          },
        },
      },
    });

    if (!offer) {
      return null;
    }

    const latestRevision = offer.revisions[offer.revisions.length - 1];
    const lines = (latestRevision?.transmissionLines || []).map((l: any) => ({
      id: l.id,
      name: l.name,
    }));

    return {
      offerId,
      lines,
    };
  }
}
