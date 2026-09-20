import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../app/prisma.service';
import { ExportDataQueryPort, OfferExportData } from '../../domain';

@Injectable()
export class PrismaExportDataQueryAdapter implements ExportDataQueryPort {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findOfferExportData(offerId: number): Promise<OfferExportData | null> {
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

    const latestRevision =
      offer.revisions && offer.revisions.length > 0
        ? offer.revisions[offer.revisions.length - 1]
        : null;

    const lines = (latestRevision?.transmissionLines || []).map((l: any) => ({
      id: l.id,
      name: l.name || `Linha ID ${l.id}`,
      refinedLengthKm: l.refinedLengthKm ? l.refinedLengthKm.toString() : null,
      reportLengthKm: l.reportLengthKm ? l.reportLengthKm.toString() : null,
      voltageKv: l.nominalVoltageKv || l.voltageKv || 500,
    }));

    return {
      id: offer.id,
      name: offer.name || `Proposta #${offer.id}`,
      code: offer.code || `PROP-${offer.id}`,
      client: offer.client || 'Concessionária Transmissão',
      createdAt: offer.createdAt,
      revisionNumber: latestRevision ? latestRevision.revisionNumber : 0,
      transmissionLines: lines,
    };
  }
}
