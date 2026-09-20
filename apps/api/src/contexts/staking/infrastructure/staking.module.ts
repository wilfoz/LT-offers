import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import {
  STAKING_TOWERS_REPOSITORY_TOKEN,
  PRELIMINARY_DISTRIBUTION_REPOSITORY_TOKEN,
  STAKING_CATALOG_QUERY_PORT_TOKEN,
  STAKING_UNIT_OF_WORK_TOKEN,
} from '../domain';
import {
  GetPaginatedStakingTowersUseCase,
  GetStakingTowerByIdUseCase,
  CreateStakingTowerUseCase,
  UpdateStakingTowerUseCase,
  DeleteStakingTowerUseCase,
  BatchAssignStakingUseCase,
  ValidateStakingIntegrityUseCase,
  GetPreliminaryDistributionUseCase,
  SavePreliminaryDistributionUseCase,
  PreviewPlsCaddImportUseCase,
  CommitPlsCaddImportUseCase,
} from '../application';
import {
  PrismaStakingTowersRepository,
  PrismaPreliminaryDistributionRepository,
  PrismaStakingCatalogQueryAdapter,
  PrismaStakingUnitOfWork,
} from './database/prisma';
import { StakingController } from './http/controllers/staking.controller';

const useCases = [
  GetPaginatedStakingTowersUseCase,
  GetStakingTowerByIdUseCase,
  CreateStakingTowerUseCase,
  UpdateStakingTowerUseCase,
  DeleteStakingTowerUseCase,
  BatchAssignStakingUseCase,
  ValidateStakingIntegrityUseCase,
  GetPreliminaryDistributionUseCase,
  SavePreliminaryDistributionUseCase,
  PreviewPlsCaddImportUseCase,
  CommitPlsCaddImportUseCase,
];

@Module({
  controllers: [StakingController],
  providers: [
    PrismaService,
    PrismaStakingTowersRepository,
    PrismaPreliminaryDistributionRepository,
    PrismaStakingCatalogQueryAdapter,
    PrismaStakingUnitOfWork,
    {
      provide: STAKING_TOWERS_REPOSITORY_TOKEN,
      useClass: PrismaStakingTowersRepository,
    },
    {
      provide: PRELIMINARY_DISTRIBUTION_REPOSITORY_TOKEN,
      useClass: PrismaPreliminaryDistributionRepository,
    },
    {
      provide: STAKING_CATALOG_QUERY_PORT_TOKEN,
      useClass: PrismaStakingCatalogQueryAdapter,
    },
    {
      provide: STAKING_UNIT_OF_WORK_TOKEN,
      useClass: PrismaStakingUnitOfWork,
    },
    ...useCases,
  ],
  exports: [
    STAKING_TOWERS_REPOSITORY_TOKEN,
    PRELIMINARY_DISTRIBUTION_REPOSITORY_TOKEN,
    STAKING_CATALOG_QUERY_PORT_TOKEN,
    STAKING_UNIT_OF_WORK_TOKEN,
    ...useCases,
  ],
})
export class StakingModule {}
