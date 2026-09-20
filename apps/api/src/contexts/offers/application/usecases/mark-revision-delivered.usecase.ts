import { Offer } from '../../domain/entities/offer.entity';
import {
  OfferNotFoundException,
  RevisionNotFoundException,
} from '../../domain/exceptions/offer-domain.exceptions';
import { OffersUnitOfWork } from '../../domain/ports/offers-unit-of-work';

export class MarkRevisionDeliveredUseCase {
  constructor(private readonly uow: OffersUnitOfWork) {}

  async execute(offerId: number, revisionId: number): Promise<Offer> {
    return this.uow.runInTransaction(async ({ offers, revisions }) => {
      const offer = await offers.findById(offerId);
      if (!offer) {
        throw new OfferNotFoundException(offerId);
      }

      const revision = offer.getRevisionById(revisionId);
      if (!revision) {
        throw new RevisionNotFoundException(revisionId);
      }

      revision.markDelivered();
      await revisions.save(revision);

      const updatedOffer = await offers.findById(offerId);
      if (!updatedOffer) {
        throw new OfferNotFoundException(offerId);
      }
      return updatedOffer;
    });
  }
}
