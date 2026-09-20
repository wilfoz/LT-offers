import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../app/prisma.service';
import { BaselineOfferBasics, BaselineOfferQueryPort } from '../../../domain';

@Injectable()
export class PrismaBaselineOfferQueryAdapter implements BaselineOfferQueryPort {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findOfferBasics(offerId: number): Promise<BaselineOfferBasics | null> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return null;
    }

    return {
      id: offer.id,
      code: offer.code,
      name: offer.name,
    };
  }
}
