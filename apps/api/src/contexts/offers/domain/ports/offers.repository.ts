import { Offer } from '../entities/offer.entity';

export const OFFERS_REPOSITORY = Symbol('OFFERS_REPOSITORY');

export interface OffersFilter {
  search?: string;
}

export interface OffersRepository {
  findById(id: number): Promise<Offer | null>;
  findByCode(code: string): Promise<Offer | null>;
  list(filter?: OffersFilter): Promise<Offer[]>;
  save(offer: Offer): Promise<Offer>;
  delete(id: number): Promise<void>;
}
