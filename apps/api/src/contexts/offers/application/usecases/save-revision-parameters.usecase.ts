import { UpdateOfferRevisionPayload } from '@lt-offers/domain';
import { Offer } from '../../domain/entities/offer.entity';
import {
  OfferNotFoundException,
  RevisionNotFoundException,
} from '../../domain/exceptions/offer-domain.exceptions';
import { OffersUnitOfWork } from '../../domain/ports/offers-unit-of-work';

export class SaveRevisionParametersUseCase {
  constructor(private readonly uow: OffersUnitOfWork) {}

  async execute(
    offerId: number,
    revisionId: number,
    params: UpdateOfferRevisionPayload,
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

      revision.updateParameters({
        auctionName: params.auctionName?.trim(),
        lotName: params.lotName?.trim(),
        offerDate: params.offerDate,
        auctionDate: params.auctionDate ?? undefined,
        scheduleStartDate: params.scheduleStartDate ?? undefined,
        commercialOperationDate: params.commercialOperationDate ?? undefined,
        estimatedCapex: params.estimatedCapex ?? undefined,
        maxRap: params.maxRap ?? undefined,
        winningRap: params.winningRap ?? undefined,
        notes: params.notes?.trim() || undefined,
      });

      await revisions.save(revision);

      const updatedOffer = await offers.findById(offerId);
      if (!updatedOffer) {
        throw new OfferNotFoundException(offerId);
      }
      return updatedOffer;
    });
  }
}
