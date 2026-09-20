import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../app/prisma.service';
import { EconomicsDataQueryPort, EconomicsLineData } from '../../../domain';

@Injectable()
export class PrismaEconomicsDataQueryAdapter implements EconomicsDataQueryPort {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findLineEconomicsData(
    lineId: number,
  ): Promise<EconomicsLineData | null> {
    const line = await this.prisma.transmissionLine.findUnique({
      where: { id: lineId },
      include: {
        offerRevision: true,
      },
    });

    if (!line) {
      return null;
    }

    return {
      id: line.id,
      name: line.name,
      refinedLengthKm: line.refinedLengthKm?.toString() ?? null,
      reportLengthKm: line.reportLengthKm?.toString() ?? null,
      offerId: line.offerRevision.offerId,
    };
  }

  async findOfferLineIds(offerId: number): Promise<number[] | null> {
    const offer = await this.prisma.offer.findUnique({
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

    // Comportamento herdado do legado: última revisão na ordem persistida
    // (sem orderBy) e linhas na ordem em que o Prisma as devolve.
    const latestRevision =
      offer.revisions && offer.revisions.length > 0
        ? offer.revisions[offer.revisions.length - 1]
        : null;

    return latestRevision
      ? latestRevision.transmissionLines.map((l) => l.id)
      : [];
  }
}
