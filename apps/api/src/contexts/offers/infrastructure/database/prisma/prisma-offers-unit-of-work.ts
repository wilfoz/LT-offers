import { Injectable } from '@nestjs/common';
import {
  OffersTransactionalContext,
  OffersUnitOfWork,
} from '../../../domain/ports/offers-unit-of-work';
import { PrismaOffersRepository } from './prisma-offers.repository';
import { PrismaOfferRevisionsRepository } from './prisma-offer-revisions.repository';
import { PrismaService } from '../../../../../app/prisma.service';

@Injectable()
export class PrismaOffersUnitOfWork implements OffersUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(
    work: (context: OffersTransactionalContext) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const offers = new PrismaOffersRepository(tx);
      const revisions = new PrismaOfferRevisionsRepository(tx);
      return work({ offers, revisions });
    });
  }
}
