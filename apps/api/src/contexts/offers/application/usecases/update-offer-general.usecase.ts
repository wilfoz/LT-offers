import { UpdateOfferGeneralPayload } from '@lt-offers/domain';
import { Offer } from '../../domain/entities/offer.entity';
import { OfferNotFoundException } from '../../domain/exceptions/offer-domain.exceptions';
import { OffersRepository } from '../../domain/ports/offers.repository';

export class UpdateOfferGeneralUseCase {
  constructor(private readonly offersRepo: OffersRepository) {}

  async execute(
    offerId: number,
    payload: UpdateOfferGeneralPayload,
  ): Promise<Offer> {
    const offer = await this.offersRepo.findById(offerId);
    if (!offer) {
      throw new OfferNotFoundException(offerId);
    }

    offer.updateGeneralData({
      name: payload.name,
      clientName: payload.clientName,
      baseCurrency: payload.baseCurrency,
    });

    return this.offersRepo.save(offer);
  }
}
