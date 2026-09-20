import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../app/prisma.service';
import { PricingDataQueryPort, PricingLineData } from '../../../domain';

@Injectable()
export class PrismaPricingDataQueryAdapter implements PricingDataQueryPort {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findLinePricingData(lineId: number): Promise<PricingLineData | null> {
    const line = await this.prisma.transmissionLine.findUnique({
      where: { id: lineId },
    });

    if (!line) {
      return null;
    }

    return {
      id: line.id,
      name: line.name,
      refinedLengthKm: line.refinedLengthKm?.toString() ?? null,
      reportLengthKm: line.reportLengthKm?.toString() ?? null,
      destinationStatePrimary: line.destinationStatePrimary,
      destinationPercentagePrimary:
        line.destinationPercentagePrimary?.toString() ?? null,
      destinationStateSecondary: line.destinationStateSecondary,
      destinationPercentageSecondary:
        line.destinationPercentageSecondary?.toString() ?? null,
    };
  }
}
