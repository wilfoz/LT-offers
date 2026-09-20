import { CloneOfferPayload } from '@lt-offers/domain';
import { Offer } from '../../domain/entities/offer.entity';
import { OfferRevision } from '../../domain/entities/offer-revision.entity';
import { TransmissionLine } from '../../domain/entities/transmission-line.entity';
import { ScopeMatrixItem } from '../../domain/entities/scope-matrix-item.entity';
import {
  DuplicateOfferCodeException,
  OfferNotFoundException,
} from '../../domain/exceptions/offer-domain.exceptions';
import { OffersUnitOfWork } from '../../domain/ports/offers-unit-of-work';

export class CloneOfferUseCase {
  constructor(private readonly uow: OffersUnitOfWork) {}

  async execute(
    sourceOfferId: number,
    payload: CloneOfferPayload,
    userEmail = 'system@epc.com',
  ): Promise<Offer> {
    const targetCode = payload.targetCode.trim();
    const targetName = payload.targetName.trim();

    return this.uow.runInTransaction(async ({ offers }) => {
      const sourceOffer = await offers.findById(sourceOfferId);
      if (!sourceOffer) {
        throw new OfferNotFoundException(sourceOfferId);
      }

      const existingCode = await offers.findByCode(targetCode);
      if (existingCode) {
        throw new DuplicateOfferCodeException(targetCode);
      }

      const sourceRevision = sourceOffer.getCurrentRevision();
      if (!sourceRevision) {
        throw new Error(
          `A proposta de origem #${sourceOfferId} não possui revisões para clonar.`,
        );
      }

      // Clona linhas de transmissão
      const clonedLines = sourceRevision.transmissionLines.map((line) =>
        TransmissionLine.create({
          code: line.code,
          name: line.name,
          nominalVoltageKv: line.nominalVoltageKv,
          refinedLengthKm: line.refinedLengthKm,
          reportLengthKm: line.reportLengthKm,
          circuitCount: line.circuitCount,
          bundleConductorCount: line.bundleConductorCount,
          destinationStatePrimary: line.destinationStatePrimary,
          destinationPercentagePrimary: line.destinationPercentagePrimary,
          destinationStateSecondary: line.destinationStateSecondary ?? null,
          destinationPercentageSecondary:
            line.destinationPercentageSecondary ?? '0',
        }),
      );

      // Clona matriz de escopo
      const clonedScopeItems = sourceRevision.scopeMatrixItems.map((item) =>
        ScopeMatrixItem.create({
          itemCode: item.itemCode,
          itemName: item.itemName,
          category: item.category,
          responsibleParty: item.responsibleParty,
          acceptsDirectBilling: item.acceptsDirectBilling,
          currencyRiskParty: item.currencyRiskParty,
          commodityRiskParty: item.commodityRiskParty,
          notes: item.notes ?? null,
        }),
      );

      // Nova revisão inicial R0 para a proposta clonada
      const initialRevision = OfferRevision.create({
        revisionNumber: 0,
        status: 'DRAFT',
        auctionName:
          payload.targetAuctionName?.trim() ||
          sourceRevision.auctionName ||
          'Leilão',
        lotName:
          payload.targetLotName?.trim() || sourceRevision.lotName || 'Lote',
        offerDate: sourceRevision.offerDate,
        auctionDate: sourceRevision.auctionDate ?? null,
        scheduleStartDate: sourceRevision.scheduleStartDate ?? null,
        commercialOperationDate: sourceRevision.commercialOperationDate ?? null,
        estimatedCapex: sourceRevision.estimatedCapex ?? null,
        maxRap: sourceRevision.maxRap ?? null,
        winningRap: sourceRevision.winningRap ?? null,
        notes: `Clonado a partir de ${sourceOffer.code} (R${sourceRevision.revisionNumber})`,
        createdBy: payload.createdBy?.trim() || userEmail,
        transmissionLines: clonedLines,
        scopeMatrixItems: clonedScopeItems,
      });

      const newOffer = Offer.create({
        code: targetCode,
        name: targetName,
        clientName: sourceOffer.clientName,
        baseCurrency: sourceOffer.baseCurrency,
        clonedFromOfferId: sourceOffer.id,
        revisions: [initialRevision],
      });

      return offers.save(newOffer);
    });
  }
}
