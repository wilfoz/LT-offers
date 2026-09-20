import { OffersRepository } from './offers.repository';
import { OfferRevisionsRepository } from './offer-revisions.repository';

export const OFFERS_UNIT_OF_WORK = Symbol('OFFERS_UNIT_OF_WORK');

export interface OffersTransactionalContext {
  offers: OffersRepository;
  revisions: OfferRevisionsRepository;
}

export interface OffersUnitOfWork {
  runInTransaction<T>(
    work: (context: OffersTransactionalContext) => Promise<T>,
  ): Promise<T>;
}
