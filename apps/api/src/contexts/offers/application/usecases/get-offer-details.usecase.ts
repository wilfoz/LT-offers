import { Offer } from '../../domain/entities/offer.entity';
import { OfferNotFoundException } from '../../domain/exceptions/offer-domain.exceptions';
import { OffersRepository } from '../../domain/ports/offers.repository';

export class GetOfferDetailsUseCase {
  constructor(private readonly offersRepo: OffersRepository) {}

  async execute(offerId: number): Promise<Offer> {
    const offer = await this.offersRepo.findById(offerId);
    if (!offer) {
      throw new OfferNotFoundException(offerId);
    }
    return offer;
  }

  async executeByCode(code: string): Promise<Offer> {
    const trimmed = code.trim();
    const offer = await this.offersRepo.findByCode(trimmed);
    if (!offer) {
      throw new OfferNotFoundException(trimmed);
    }
    return offer;
  }
}
