import { Module, Provider } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import { AuditModule } from '../../../audit/audit.module';
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
import {
  OFFERS_AUDIT_TRAIL_PORT,
  OffersAuditTrailPort,
} from '../domain/ports/audit-trail.port';
import { PrismaOffersRepository } from './database/prisma/prisma-offers.repository';
import { PrismaOfferRevisionsRepository } from './database/prisma/prisma-offer-revisions.repository';
import { PrismaOffersUnitOfWork } from './database/prisma/prisma-offers-unit-of-work';
import { OffersAuditTrailAdapter } from './audit/audit-service-trail.adapter';
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
    useFactory: (uow: OffersUnitOfWork, auditTrail: OffersAuditTrailPort) =>
      new UpdateRevisionUseCase(uow, auditTrail),
    inject: [OFFERS_UNIT_OF_WORK, OFFERS_AUDIT_TRAIL_PORT],
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
  imports: [AuditModule],
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
    {
      provide: OFFERS_AUDIT_TRAIL_PORT,
      useClass: OffersAuditTrailAdapter,
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
