import { ScopeMatrixItemPayload } from '@lt-offers/domain';
import { Offer } from '../../domain/entities/offer.entity';
import { ScopeMatrixItem } from '../../domain/entities/scope-matrix-item.entity';
import {
  OfferNotFoundException,
  RevisionNotFoundException,
} from '../../domain/exceptions/offer-domain.exceptions';
import { OffersUnitOfWork } from '../../domain/ports/offers-unit-of-work';

export class SaveScopeMatrixUseCase {
  constructor(private readonly uow: OffersUnitOfWork) {}

  async execute(
    offerId: number,
    revisionId: number,
    items: ScopeMatrixItemPayload[],
  ): Promise<Offer> {
    return this.uow.runInTransaction(async ({ offers, revisions }) => {
      const offer = await offers.findById(offerId);
      if (!offer) {
        throw new OfferNotFoundException(offerId);
      }

      const revision = offer.getRevisionById(revisionId);
      if (!revision) {
        throw new RevisionNotFoundException(revisionId);
      }

      revision.assertIsDraft('atualizar matriz de escopo');

      const domainItems = items.map((s) =>
        ScopeMatrixItem.create({
          itemCode: s.itemCode.trim(),
          itemName: s.itemName.trim(),
          category: s.category.trim(),
          responsibleParty: s.responsibleParty,
          acceptsDirectBilling: s.acceptsDirectBilling,
          currencyRiskParty: s.currencyRiskParty,
          commodityRiskParty: s.commodityRiskParty,
          notes: s.notes?.trim() || null,
        }),
      );

      await revisions.saveScopeMatrix(revisionId, domainItems);

      const updatedOffer = await offers.findById(offerId);
      if (!updatedOffer) {
        throw new OfferNotFoundException(offerId);
      }
      return updatedOffer;
    });
  }
}
