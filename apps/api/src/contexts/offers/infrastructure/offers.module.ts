import { Module, Provider } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import {
  OFFERS_REPOSITORY,
  OffersRepository,
} from '../domain/ports/offers.repository';
import {
  OFFER_REVISIONS_REPOSITORY,
  OfferRevisionsRepository,
} from '../domain/ports/offer-revisions.repository';
import {
  OFFERS_UNIT_OF_WORK,
  OffersUnitOfWork,
} from '../domain/ports/offers-unit-of-work';
import { PrismaOffersRepository } from './database/prisma/prisma-offers.repository';
import { PrismaOfferRevisionsRepository } from './database/prisma/prisma-offer-revisions.repository';
import { PrismaOffersUnitOfWork } from './database/prisma/prisma-offers-unit-of-work';
import {
  CreateOfferUseCase,
  GetOfferDetailsUseCase,
  ListOffersUseCase,
  UpdateOfferGeneralUseCase,
  CloneOfferUseCase,
  DeleteOfferUseCase,
  CreateRevisionUseCase,
  FreezeRevisionUseCase,
  MarkRevisionDeliveredUseCase,
  SaveScopeMatrixUseCase,
  SaveRevisionParametersUseCase,
  UpdateRevisionUseCase,
  AddTransmissionLineUseCase,
  UpdateTransmissionLineUseCase,
  DeleteTransmissionLineUseCase,
} from '../application/usecases';
import { OffersController } from './http/offers.controller';

const useCaseProviders: Provider[] = [
  {
    provide: ListOffersUseCase,
    useFactory: (repo: OffersRepository) => new ListOffersUseCase(repo),
    inject: [OFFERS_REPOSITORY],
  },
  {
    provide: GetOfferDetailsUseCase,
    useFactory: (repo: OffersRepository) => new GetOfferDetailsUseCase(repo),
    inject: [OFFERS_REPOSITORY],
  },
  {
    provide: UpdateOfferGeneralUseCase,
    useFactory: (repo: OffersRepository) => new UpdateOfferGeneralUseCase(repo),
    inject: [OFFERS_REPOSITORY],
  },
  {
    provide: DeleteOfferUseCase,
    useFactory: (repo: OffersRepository) => new DeleteOfferUseCase(repo),
    inject: [OFFERS_REPOSITORY],
  },
  {
    provide: CreateOfferUseCase,
    useFactory: (uow: OffersUnitOfWork) => new CreateOfferUseCase(uow),
    inject: [OFFERS_UNIT_OF_WORK],
  },
  {
    provide: CloneOfferUseCase,
    useFactory: (uow: OffersUnitOfWork) => new CloneOfferUseCase(uow),
    inject: [OFFERS_UNIT_OF_WORK],
  },
  {
    provide: CreateRevisionUseCase,
    useFactory: (uow: OffersUnitOfWork) => new CreateRevisionUseCase(uow),
    inject: [OFFERS_UNIT_OF_WORK],
  },
  {
    provide: UpdateRevisionUseCase,
    useFactory: (uow: OffersUnitOfWork) => new UpdateRevisionUseCase(uow),
    inject: [OFFERS_UNIT_OF_WORK],
  },
  {
    provide: FreezeRevisionUseCase,
    useFactory: (uow: OffersUnitOfWork) => new FreezeRevisionUseCase(uow),
    inject: [OFFERS_UNIT_OF_WORK],
  },
  {
    provide: MarkRevisionDeliveredUseCase,
    useFactory: (uow: OffersUnitOfWork) =>
      new MarkRevisionDeliveredUseCase(uow),
    inject: [OFFERS_UNIT_OF_WORK],
  },
  {
    provide: SaveScopeMatrixUseCase,
    useFactory: (uow: OffersUnitOfWork) => new SaveScopeMatrixUseCase(uow),
    inject: [OFFERS_UNIT_OF_WORK],
  },
  {
    provide: SaveRevisionParametersUseCase,
    useFactory: (uow: OffersUnitOfWork) =>
      new SaveRevisionParametersUseCase(uow),
    inject: [OFFERS_UNIT_OF_WORK],
  },
  {
    provide: AddTransmissionLineUseCase,
    useFactory: (uow: OffersUnitOfWork) => new AddTransmissionLineUseCase(uow),
    inject: [OFFERS_UNIT_OF_WORK],
  },
  {
    provide: UpdateTransmissionLineUseCase,
    useFactory: (uow: OffersUnitOfWork) =>
      new UpdateTransmissionLineUseCase(uow),
    inject: [OFFERS_UNIT_OF_WORK],
  },
  {
    provide: DeleteTransmissionLineUseCase,
    useFactory: (uow: OffersUnitOfWork) =>
      new DeleteTransmissionLineUseCase(uow),
    inject: [OFFERS_UNIT_OF_WORK],
  },
];

@Module({
  controllers: [OffersController],
  providers: [
    PrismaService,
    {
      provide: OFFERS_REPOSITORY,
      useClass: PrismaOffersRepository,
    },
    {
      provide: OFFER_REVISIONS_REPOSITORY,
      useClass: PrismaOfferRevisionsRepository,
    },
    {
      provide: OFFERS_UNIT_OF_WORK,
      useClass: PrismaOffersUnitOfWork,
    },
    ...useCaseProviders,
  ],
  exports: [
    OFFERS_REPOSITORY,
    OFFER_REVISIONS_REPOSITORY,
    OFFERS_UNIT_OF_WORK,
    ...useCaseProviders.map((p) =>
      typeof p === 'object' && 'provide' in p ? p.provide : p,
    ),
  ],
})
export class OffersModule {}
