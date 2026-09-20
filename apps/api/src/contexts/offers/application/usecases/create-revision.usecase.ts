import { CreateNewRevisionPayload } from '@lt-offers/domain';
import { Offer } from '../../domain/entities/offer.entity';
import { OfferRevision } from '../../domain/entities/offer-revision.entity';
import { TransmissionLine } from '../../domain/entities/transmission-line.entity';
import { ScopeMatrixItem } from '../../domain/entities/scope-matrix-item.entity';
import { OfferNotFoundException } from '../../domain/exceptions/offer-domain.exceptions';
import { OffersUnitOfWork } from '../../domain/ports/offers-unit-of-work';

export class CreateRevisionUseCase {
  constructor(private readonly uow: OffersUnitOfWork) {}

  async execute(
    offerId: number,
    payload: CreateNewRevisionPayload,
    userEmail = 'system@epc.com',
  ): Promise<Offer> {
    return this.uow.runInTransaction(async ({ offers, revisions }) => {
      const offer = await offers.findById(offerId);
      if (!offer) {
        throw new OfferNotFoundException(offerId);
      }

      const latestRevision = offer.getCurrentRevision();
      const nextRevisionNumber = latestRevision
        ? latestRevision.revisionNumber + 1
        : 0;

      // Clona linhas de transmissão da revisão anterior
      const clonedLines = (latestRevision?.transmissionLines || []).map(
        (line) =>
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

      // Clona itens da matriz de escopo da revisão anterior
      const clonedScopeItems = (latestRevision?.scopeMatrixItems || []).map(
        (item) =>
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

      const newRevision = OfferRevision.create({
        offerId,
        revisionNumber: nextRevisionNumber,
        status: 'DRAFT',
        auctionName: latestRevision?.auctionName ?? 'Leilão',
        lotName: latestRevision?.lotName ?? 'Lote',
        offerDate:
          latestRevision?.offerDate ?? new Date().toISOString().slice(0, 10),
        auctionDate: latestRevision?.auctionDate ?? null,
        scheduleStartDate: latestRevision?.scheduleStartDate ?? null,
        commercialOperationDate:
          latestRevision?.commercialOperationDate ?? null,
        estimatedCapex: latestRevision?.estimatedCapex ?? null,
        maxRap: latestRevision?.maxRap ?? null,
        winningRap: latestRevision?.winningRap ?? null,
        notes:
          payload.notes?.trim() ||
          `Revisão R${nextRevisionNumber} criada a partir de R${latestRevision?.revisionNumber ?? 0}`,
        createdBy: payload.createdBy?.trim() || userEmail,
        transmissionLines: clonedLines,
        scopeMatrixItems: clonedScopeItems,
      });

      await revisions.save(newRevision);

      const updatedOffer = await offers.findById(offerId);
      if (!updatedOffer) {
        throw new OfferNotFoundException(offerId);
      }
      return updatedOffer;
    });
  }
}
