import { Offer } from '../../domain/entities/offer.entity';
import { OffersRepository } from '../../domain/ports/offers.repository';

export class ListOffersUseCase {
  constructor(private readonly offersRepo: OffersRepository) {}

  async execute(search?: string): Promise<Offer[]> {
    return this.offersRepo.list({ search });
  }
}
