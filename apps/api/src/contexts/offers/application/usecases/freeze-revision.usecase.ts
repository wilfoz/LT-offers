import { Offer } from '../../domain/entities/offer.entity';
import {
  OfferNotFoundException,
  RevisionNotFoundException,
} from '../../domain/exceptions/offer-domain.exceptions';
import { OffersUnitOfWork } from '../../domain/ports/offers-unit-of-work';

export class FreezeRevisionUseCase {
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

      // Validação de regra RF-63: Não é possível fechar ou congelar sem linhas de transmissão
      if (revision.transmissionLines.length === 0) {
        throw new Error(
          'Não é possível fechar ou congelar uma revisão sem linhas de transmissão cadastradas (RF-63).',
        );
      }

      revision.freeze();
      await revisions.save(revision);

      const updatedOffer = await offers.findById(offerId);
      if (!updatedOffer) {
        throw new OfferNotFoundException(offerId);
      }
      return updatedOffer;
    });
  }
}
