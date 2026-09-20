import {
  OfferDetail,
  OfferRevisionItem,
  OfferSummary,
  ScopeMatrixItemPayload,
  TransmissionLineItem,
} from '@lt-offers/domain';
import { DecimalValue } from '@lt-offers/calc-engine';
import { Offer } from '../../../domain/entities/offer.entity';
import { OfferRevision } from '../../../domain/entities/offer-revision.entity';
import { TransmissionLine } from '../../../domain/entities/transmission-line.entity';
import { ScopeMatrixItem } from '../../../domain/entities/scope-matrix-item.entity';

function toIso(d: Date | string | undefined | null): string {
  if (!d) return new Date().toISOString();
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

function toIsoOrNull(d: Date | string | undefined | null): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

export class OfferPresenter {
  static toSummary(offer: Offer): OfferSummary {
    const currentRev = offer.getCurrentRevision();
    const lines = currentRev?.transmissionLines ?? [];
    const lineCount = lines.length;

    let totalKm = DecimalValue.zero();
    let hasInvalidAllocation = false;

    for (const line of lines) {
      totalKm = totalKm.plus(DecimalValue.of(line.reportLengthKm || '0'));
      const p1 = DecimalValue.of(line.destinationPercentagePrimary || '0');
      const p2 = DecimalValue.of(line.destinationPercentageSecondary || '0');
      if (!p1.plus(p2).equals(DecimalValue.of(100))) {
        hasInvalidAllocation = true;
      }
    }

    const hasPendingIssues =
      !currentRev ||
      lineCount === 0 ||
      hasInvalidAllocation ||
      (currentRev.scopeMatrixItems?.length ?? 0) === 0;

    return {
      id: offer.id!,
      code: offer.code,
      name: offer.name,
      clientName: offer.clientName,
      baseCurrency: offer.baseCurrency,
      clonedFromOfferId: offer.clonedFromOfferId ?? null,
      currentRevisionNumber: currentRev ? currentRev.revisionNumber : 0,
      currentRevisionStatus: currentRev ? currentRev.status : 'DRAFT',
      auctionName: currentRev?.auctionName ?? '—',
      lotName: currentRev?.lotName ?? '—',
      lineCount,
      totalLengthKm: totalKm.toFixed(3),
      hasPendingIssues,
      createdBy: currentRev?.createdBy ?? 'system',
      createdAt: toIso(offer.createdAt),
      updatedAt: toIso(offer.updatedAt),
    };
  }

  static toDetail(offer: Offer): OfferDetail {
    const currentRev = offer.getCurrentRevision();

    return {
      id: offer.id!,
      code: offer.code,
      name: offer.name,
      clientName: offer.clientName,
      baseCurrency: offer.baseCurrency,
      clonedFromOfferId: offer.clonedFromOfferId ?? null,
      createdBy: currentRev?.createdBy ?? 'system',
      createdAt: toIso(offer.createdAt),
      updatedAt: toIso(offer.updatedAt),
      revisions: offer.revisions.map((rev) =>
        OfferPresenter.toRevisionItem(rev),
      ),
    };
  }

  static toRevisionItem(rev: OfferRevision): OfferRevisionItem {
    return {
      id: rev.id!,
      offerId: rev.offerId!,
      revisionNumber: rev.revisionNumber,
      status: rev.status,
      auctionName: rev.auctionName,
      lotName: rev.lotName,
      offerDate: rev.offerDate.slice(0, 10),
      auctionDate: rev.auctionDate ? rev.auctionDate.slice(0, 10) : null,
      scheduleStartDate: rev.scheduleStartDate
        ? rev.scheduleStartDate.slice(0, 10)
        : null,
      commercialOperationDate: rev.commercialOperationDate
        ? rev.commercialOperationDate.slice(0, 10)
        : null,
      estimatedCapex: rev.estimatedCapex
        ? DecimalValue.of(rev.estimatedCapex).toFixed(2)
        : null,
      maxRap: rev.maxRap ? DecimalValue.of(rev.maxRap).toFixed(2) : null,
      winningRap: rev.winningRap
        ? DecimalValue.of(rev.winningRap).toFixed(2)
        : null,
      notes: rev.notes ?? null,
      closedAt: toIsoOrNull(rev.closedAt),
      deliveredAt: toIsoOrNull(rev.deliveredAt),
      createdBy: rev.createdBy ?? 'system',
      createdAt: toIso(rev.createdAt),
      updatedAt: toIso(rev.updatedAt),
      transmissionLines: rev.transmissionLines.map((line) =>
        OfferPresenter.toLineItem(line),
      ),
      scopeMatrixItems: rev.scopeMatrixItems.map((scope) =>
        OfferPresenter.toScopeItem(scope),
      ),
    };
  }

  static toLineItem(line: TransmissionLine): TransmissionLineItem {
    return {
      id: line.id,
      code: line.code,
      name: line.name,
      nominalVoltageKv: DecimalValue.of(line.nominalVoltageKv).toFixed(2),
      refinedLengthKm: DecimalValue.of(line.refinedLengthKm).toFixed(3),
      reportLengthKm: DecimalValue.of(line.reportLengthKm).toFixed(3),
      circuitCount: line.circuitCount,
      bundleConductorCount: line.bundleConductorCount,
      destinationStatePrimary: line.destinationStatePrimary,
      destinationPercentagePrimary: DecimalValue.of(
        line.destinationPercentagePrimary,
      ).toFixed(2),
      destinationStateSecondary: line.destinationStateSecondary ?? null,
      destinationPercentageSecondary:
        line.destinationPercentageSecondary &&
        line.destinationPercentageSecondary !== '0'
          ? DecimalValue.of(line.destinationPercentageSecondary).toFixed(2)
          : null,
    };
  }

  static toScopeItem(item: ScopeMatrixItem): ScopeMatrixItemPayload {
    return {
      id: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category,
      responsibleParty: item.responsibleParty,
      acceptsDirectBilling: item.acceptsDirectBilling,
      currencyRiskParty: item.currencyRiskParty,
      commodityRiskParty: item.commodityRiskParty,
      notes: item.notes ?? null,
    };
  }
}
