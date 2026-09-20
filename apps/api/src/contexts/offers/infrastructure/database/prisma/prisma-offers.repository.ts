import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Offer } from '../../../domain/entities/offer.entity';
import {
  OffersFilter,
  OffersRepository,
} from '../../../domain/ports/offers.repository';
import { PrismaOfferMapper } from './prisma-offer.mapper';
import { PrismaService } from '../../../../../app/prisma.service';

const Decimal = Prisma.Decimal;

@Injectable()
export class PrismaOffersRepository implements OffersRepository {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<Offer | null> {
    const raw = await this.prisma.offer.findUnique({
      where: { id },
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          include: {
            transmissionLines: {
              orderBy: { code: 'asc' },
            },
            scopeMatrixItems: {
              orderBy: { itemCode: 'asc' },
            },
          },
        },
      },
    });

    if (!raw) return null;
    return PrismaOfferMapper.toDomain(raw);
  }

  async findByCode(code: string): Promise<Offer | null> {
    const raw = await this.prisma.offer.findUnique({
      where: { code },
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          include: {
            transmissionLines: {
              orderBy: { code: 'asc' },
            },
            scopeMatrixItems: {
              orderBy: { itemCode: 'asc' },
            },
          },
        },
      },
    });

    if (!raw) return null;
    return PrismaOfferMapper.toDomain(raw);
  }

  async list(filter?: OffersFilter): Promise<Offer[]> {
    const trimmed = filter?.search?.trim();
    const where: Prisma.OfferWhereInput = trimmed
      ? {
          OR: [
            { code: { contains: trimmed, mode: 'insensitive' } },
            { name: { contains: trimmed, mode: 'insensitive' } },
            { clientName: { contains: trimmed, mode: 'insensitive' } },
            {
              revisions: {
                some: {
                  OR: [
                    {
                      auctionName: {
                        contains: trimmed,
                        mode: 'insensitive',
                      },
                    },
                    {
                      lotName: {
                        contains: trimmed,
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {};

    const rawOffers = await this.prisma.offer.findMany({
      where,
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          include: {
            transmissionLines: {
              orderBy: { code: 'asc' },
            },
            scopeMatrixItems: {
              orderBy: { itemCode: 'asc' },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return rawOffers.map((raw) => PrismaOfferMapper.toDomain(raw));
  }

  async save(offer: Offer): Promise<Offer> {
    if (offer.id) {
      // Atualização de proposta existente
      const updated = await this.prisma.offer.update({
        where: { id: offer.id },
        data: {
          name: offer.name,
          clientName: offer.clientName,
          baseCurrency: offer.baseCurrency,
        },
        include: {
          revisions: {
            orderBy: { revisionNumber: 'desc' },
            include: {
              transmissionLines: true,
              scopeMatrixItems: true,
            },
          },
        },
      });

      return PrismaOfferMapper.toDomain(updated);
    }

    // Criação de nova proposta
    const createdOffer = await this.prisma.offer.create({
      data: {
        code: offer.code,
        name: offer.name,
        clientName: offer.clientName,
        baseCurrency: offer.baseCurrency,
        clonedFromOfferId: offer.clonedFromOfferId,
        createdBy: offer.revisions[0]?.createdBy ?? 'system',
      },
    });

    // Se possui revisões iniciais (ex: R0)
    for (const rev of offer.revisions) {
      const createdRev = await this.prisma.offerRevision.create({
        data: {
          offerId: createdOffer.id,
          revisionNumber: rev.revisionNumber,
          status: rev.status as any,
          auctionName: rev.auctionName,
          lotName: rev.lotName,
          offerDate: new Date(rev.offerDate),
          auctionDate: rev.auctionDate ? new Date(rev.auctionDate) : null,
          scheduleStartDate: rev.scheduleStartDate
            ? new Date(rev.scheduleStartDate)
            : null,
          commercialOperationDate: rev.commercialOperationDate
            ? new Date(rev.commercialOperationDate)
            : null,
          estimatedCapex: rev.estimatedCapex
            ? new Decimal(rev.estimatedCapex)
            : null,
          maxRap: rev.maxRap ? new Decimal(rev.maxRap) : null,
          winningRap: rev.winningRap ? new Decimal(rev.winningRap) : null,
          notes: rev.notes,
          createdBy: rev.createdBy,
        },
      });

      if (rev.transmissionLines.length > 0) {
        await this.prisma.transmissionLine.createMany({
          data: rev.transmissionLines.map((l) => ({
            offerRevisionId: createdRev.id,
            code: l.code,
            name: l.name,
            nominalVoltageKv: new Decimal(l.nominalVoltageKv),
            refinedLengthKm: new Decimal(l.refinedLengthKm),
            reportLengthKm: new Decimal(l.reportLengthKm),
            circuitCount: l.circuitCount,
            bundleConductorCount: l.bundleConductorCount,
            destinationStatePrimary: l.destinationStatePrimary,
            destinationPercentagePrimary: new Decimal(
              l.destinationPercentagePrimary,
            ),
            destinationStateSecondary: l.destinationStateSecondary || null,
            destinationPercentageSecondary:
              l.destinationPercentageSecondary &&
              l.destinationPercentageSecondary !== '0'
                ? new Decimal(l.destinationPercentageSecondary)
                : null,
          })),
        });
      }

      if (rev.scopeMatrixItems.length > 0) {
        await this.prisma.scopeMatrixItem.createMany({
          data: rev.scopeMatrixItems.map((s) => ({
            offerRevisionId: createdRev.id,
            itemCode: s.itemCode,
            itemName: s.itemName,
            category: s.category,
            responsibleParty: s.responsibleParty as any,
            acceptsDirectBilling: s.acceptsDirectBilling,
            currencyRiskParty: s.currencyRiskParty as any,
            commodityRiskParty: s.commodityRiskParty as any,
            notes: s.notes,
          })),
        });
      }
    }

    const reloaded = await this.prisma.offer.findUniqueOrThrow({
      where: { id: createdOffer.id },
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          include: {
            transmissionLines: {
              orderBy: { code: 'asc' },
            },
            scopeMatrixItems: {
              orderBy: { itemCode: 'asc' },
            },
          },
        },
      },
    });

    return PrismaOfferMapper.toDomain(reloaded);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.offer.delete({
      where: { id },
    });
  }
}
