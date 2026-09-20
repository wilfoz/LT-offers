import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { OfferRevision } from '../../../domain/entities/offer-revision.entity';
import { TransmissionLine } from '../../../domain/entities/transmission-line.entity';
import { ScopeMatrixItem } from '../../../domain/entities/scope-matrix-item.entity';
import { OfferRevisionsRepository } from '../../../domain/ports/offer-revisions.repository';
import { PrismaOfferMapper } from './prisma-offer.mapper';
import { PrismaService } from '../../../../../app/prisma.service';

const Decimal = Prisma.Decimal;

@Injectable()
export class PrismaOfferRevisionsRepository implements OfferRevisionsRepository {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<OfferRevision | null> {
    const raw = await this.prisma.offerRevision.findUnique({
      where: { id },
      include: {
        transmissionLines: {
          orderBy: { code: 'asc' },
        },
        scopeMatrixItems: {
          orderBy: { itemCode: 'asc' },
        },
      },
    });

    if (!raw) return null;
    return PrismaOfferMapper.toRevisionDomain(raw);
  }

  async findByOfferIdAndNumber(
    offerId: number,
    revisionNumber: number,
  ): Promise<OfferRevision | null> {
    const raw = await this.prisma.offerRevision.findUnique({
      where: {
        offerId_revisionNumber: {
          offerId,
          revisionNumber,
        },
      },
      include: {
        transmissionLines: {
          orderBy: { code: 'asc' },
        },
        scopeMatrixItems: {
          orderBy: { itemCode: 'asc' },
        },
      },
    });

    if (!raw) return null;
    return PrismaOfferMapper.toRevisionDomain(raw);
  }

  async save(revision: OfferRevision): Promise<OfferRevision> {
    if (revision.id) {
      const updated = await this.prisma.offerRevision.update({
        where: { id: revision.id },
        data: {
          status: revision.status as any,
          auctionName: revision.auctionName,
          lotName: revision.lotName,
          offerDate: new Date(revision.offerDate),
          auctionDate: revision.auctionDate
            ? new Date(revision.auctionDate)
            : null,
          scheduleStartDate: revision.scheduleStartDate
            ? new Date(revision.scheduleStartDate)
            : null,
          commercialOperationDate: revision.commercialOperationDate
            ? new Date(revision.commercialOperationDate)
            : null,
          estimatedCapex: revision.estimatedCapex
            ? new Decimal(revision.estimatedCapex)
            : null,
          maxRap: revision.maxRap ? new Decimal(revision.maxRap) : null,
          winningRap: revision.winningRap
            ? new Decimal(revision.winningRap)
            : null,
          notes: revision.notes,
          closedAt: revision.closedAt,
          deliveredAt: revision.deliveredAt,
        },
        include: {
          transmissionLines: {
            orderBy: { code: 'asc' },
          },
          scopeMatrixItems: {
            orderBy: { itemCode: 'asc' },
          },
        },
      });

      return PrismaOfferMapper.toRevisionDomain(updated);
    }

    if (!revision.offerId) {
      throw new Error('Não é possível salvar revisão sem offerId');
    }

    const created = await this.prisma.offerRevision.create({
      data: {
        offerId: revision.offerId,
        revisionNumber: revision.revisionNumber,
        status: revision.status as any,
        auctionName: revision.auctionName,
        lotName: revision.lotName,
        offerDate: new Date(revision.offerDate),
        auctionDate: revision.auctionDate
          ? new Date(revision.auctionDate)
          : null,
        scheduleStartDate: revision.scheduleStartDate
          ? new Date(revision.scheduleStartDate)
          : null,
        commercialOperationDate: revision.commercialOperationDate
          ? new Date(revision.commercialOperationDate)
          : null,
        estimatedCapex: revision.estimatedCapex
          ? new Decimal(revision.estimatedCapex)
          : null,
        maxRap: revision.maxRap ? new Decimal(revision.maxRap) : null,
        winningRap: revision.winningRap
          ? new Decimal(revision.winningRap)
          : null,
        notes: revision.notes,
        createdBy: revision.createdBy,
      },
    });

    if (revision.transmissionLines.length > 0) {
      await this.prisma.transmissionLine.createMany({
        data: revision.transmissionLines.map((l) => ({
          offerRevisionId: created.id,
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

    if (revision.scopeMatrixItems.length > 0) {
      await this.prisma.scopeMatrixItem.createMany({
        data: revision.scopeMatrixItems.map((s) => ({
          offerRevisionId: created.id,
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

    const reloaded = await this.prisma.offerRevision.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        transmissionLines: {
          orderBy: { code: 'asc' },
        },
        scopeMatrixItems: {
          orderBy: { itemCode: 'asc' },
        },
      },
    });

    return PrismaOfferMapper.toRevisionDomain(reloaded);
  }

  async saveScopeMatrix(
    revisionId: number,
    items: ScopeMatrixItem[],
  ): Promise<ScopeMatrixItem[]> {
    await this.prisma.scopeMatrixItem.deleteMany({
      where: { offerRevisionId: revisionId },
    });

    if (items.length > 0) {
      await this.prisma.scopeMatrixItem.createMany({
        data: items.map((s) => ({
          offerRevisionId: revisionId,
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

    return items;
  }

  async saveTransmissionLines(
    revisionId: number,
    lines: TransmissionLine[],
  ): Promise<TransmissionLine[]> {
    await this.prisma.transmissionLine.deleteMany({
      where: { offerRevisionId: revisionId },
    });

    if (lines.length > 0) {
      await this.prisma.transmissionLine.createMany({
        data: lines.map((l) => ({
          offerRevisionId: revisionId,
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

    return lines;
  }

  async addTransmissionLine(
    revisionId: number,
    line: TransmissionLine,
  ): Promise<TransmissionLine> {
    const created = await this.prisma.transmissionLine.create({
      data: {
        offerRevisionId: revisionId,
        code: line.code,
        name: line.name,
        nominalVoltageKv: new Decimal(line.nominalVoltageKv),
        refinedLengthKm: new Decimal(line.refinedLengthKm),
        reportLengthKm: new Decimal(line.reportLengthKm),
        circuitCount: line.circuitCount,
        bundleConductorCount: line.bundleConductorCount,
        destinationStatePrimary: line.destinationStatePrimary,
        destinationPercentagePrimary: new Decimal(
          line.destinationPercentagePrimary,
        ),
        destinationStateSecondary: line.destinationStateSecondary || null,
        destinationPercentageSecondary:
          line.destinationPercentageSecondary &&
          line.destinationPercentageSecondary !== '0'
            ? new Decimal(line.destinationPercentageSecondary)
            : null,
      },
    });

    return PrismaOfferMapper.toLineDomain(created);
  }

  async updateTransmissionLine(
    revisionId: number,
    lineId: number,
    line: TransmissionLine,
  ): Promise<TransmissionLine> {
    const updated = await this.prisma.transmissionLine.update({
      where: { id: lineId },
      data: {
        code: line.code,
        name: line.name,
        nominalVoltageKv: new Decimal(line.nominalVoltageKv),
        refinedLengthKm: new Decimal(line.refinedLengthKm),
        reportLengthKm: new Decimal(line.reportLengthKm),
        circuitCount: line.circuitCount,
        bundleConductorCount: line.bundleConductorCount,
        destinationStatePrimary: line.destinationStatePrimary,
        destinationPercentagePrimary: new Decimal(
          line.destinationPercentagePrimary,
        ),
        destinationStateSecondary: line.destinationStateSecondary || null,
        destinationPercentageSecondary:
          line.destinationPercentageSecondary &&
          line.destinationPercentageSecondary !== '0'
            ? new Decimal(line.destinationPercentageSecondary)
            : null,
      },
    });

    return PrismaOfferMapper.toLineDomain(updated);
  }

  async deleteTransmissionLine(
    revisionId: number,
    lineId: number,
  ): Promise<void> {
    await this.prisma.transmissionLine.delete({
      where: { id: lineId },
    });
  }
}
