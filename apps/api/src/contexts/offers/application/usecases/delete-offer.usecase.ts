import { OfferNotFoundException } from '../../domain/exceptions/offer-domain.exceptions';
import { OffersRepository } from '../../domain/ports/offers.repository';

export class DeleteOfferUseCase {
  constructor(private readonly offersRepo: OffersRepository) {}

  async execute(offerId: number): Promise<void> {
    const offer = await this.offersRepo.findById(offerId);
    if (!offer) {
      throw new OfferNotFoundException(offerId);
    }
    await this.offersRepo.delete(offerId);
  }
}
