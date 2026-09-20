import { Prisma } from '@prisma/client';
import { Offer } from '../../../domain/entities/offer.entity';
import { OfferRevision } from '../../../domain/entities/offer-revision.entity';
import { TransmissionLine } from '../../../domain/entities/transmission-line.entity';
import { ScopeMatrixItem } from '../../../domain/entities/scope-matrix-item.entity';

export type PrismaOfferWithRelations = Prisma.OfferGetPayload<{
  include: {
    revisions: {
      include: {
        transmissionLines: true;
        scopeMatrixItems: true;
      };
    };
  };
}>;

export type PrismaRevisionWithRelations = Prisma.OfferRevisionGetPayload<{
  include: {
    transmissionLines: true;
    scopeMatrixItems: true;
  };
}>;

export type PrismaTransmissionLinePayload = Prisma.TransmissionLineGetPayload<
  Record<string, never>
>;
export type PrismaScopeMatrixItemPayload = Prisma.ScopeMatrixItemGetPayload<
  Record<string, never>
>;

export class PrismaOfferMapper {
  static toDomain(raw: PrismaOfferWithRelations): Offer {
    const revisions = (raw.revisions || []).map((r) =>
      PrismaOfferMapper.toRevisionDomain(r),
    );

    return Offer.reconstitute({
      id: raw.id,
      code: raw.code,
      name: raw.name,
      clientName: raw.clientName,
      baseCurrency: raw.baseCurrency,
      clonedFromOfferId: raw.clonedFromOfferId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      revisions,
    });
  }

  static toRevisionDomain(raw: PrismaRevisionWithRelations): OfferRevision {
    const lines = (raw.transmissionLines || []).map((l) =>
      PrismaOfferMapper.toLineDomain(l),
    );
    const scopeItems = (raw.scopeMatrixItems || []).map((s) =>
      PrismaOfferMapper.toScopeDomain(s),
    );

    return OfferRevision.reconstitute({
      id: raw.id,
      offerId: raw.offerId,
      revisionNumber: raw.revisionNumber,
      status: raw.status as any,
      auctionName: raw.auctionName,
      lotName: raw.lotName,
      offerDate: raw.offerDate.toISOString().slice(0, 10),
      auctionDate: raw.auctionDate
        ? raw.auctionDate.toISOString().slice(0, 10)
        : null,
      scheduleStartDate: raw.scheduleStartDate
        ? raw.scheduleStartDate.toISOString().slice(0, 10)
        : null,
      commercialOperationDate: raw.commercialOperationDate
        ? raw.commercialOperationDate.toISOString().slice(0, 10)
        : null,
      estimatedCapex: raw.estimatedCapex ? raw.estimatedCapex.toFixed(2) : null,
      maxRap: raw.maxRap ? raw.maxRap.toFixed(2) : null,
      winningRap: raw.winningRap ? raw.winningRap.toFixed(2) : null,
      notes: raw.notes,
      closedAt: raw.closedAt,
      deliveredAt: raw.deliveredAt,
      createdBy: raw.createdBy,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      transmissionLines: lines,
      scopeMatrixItems: scopeItems,
    });
  }

  static toLineDomain(raw: PrismaTransmissionLinePayload): TransmissionLine {
    return TransmissionLine.reconstitute({
      id: raw.id,
      revisionId: raw.offerRevisionId,
      code: raw.code,
      name: raw.name,
      nominalVoltageKv: raw.nominalVoltageKv.toFixed(2),
      refinedLengthKm: raw.refinedLengthKm.toFixed(3),
      reportLengthKm: raw.reportLengthKm.toFixed(3),
      circuitCount: raw.circuitCount,
      bundleConductorCount: raw.bundleConductorCount,
      destinationStatePrimary: raw.destinationStatePrimary,
      destinationPercentagePrimary: raw.destinationPercentagePrimary.toFixed(2),
      destinationStateSecondary: raw.destinationStateSecondary,
      destinationPercentageSecondary: raw.destinationPercentageSecondary
        ? raw.destinationPercentageSecondary.toFixed(2)
        : '0',
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toScopeDomain(raw: PrismaScopeMatrixItemPayload): ScopeMatrixItem {
    return ScopeMatrixItem.reconstitute({
      id: raw.id,
      revisionId: raw.offerRevisionId,
      itemCode: raw.itemCode,
      itemName: raw.itemName,
      category: raw.category,
      responsibleParty: raw.responsibleParty as any,
      acceptsDirectBilling: raw.acceptsDirectBilling,
      currencyRiskParty: raw.currencyRiskParty as any,
      commodityRiskParty: raw.commodityRiskParty as any,
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
