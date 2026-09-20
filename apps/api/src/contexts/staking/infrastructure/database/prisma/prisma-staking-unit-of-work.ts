import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../app/prisma.service';
import {
  StakingUnitOfWork,
  StakingTransactionalRepositories,
} from '../../../domain';
import { PrismaStakingTowersRepository } from './repositories/prisma-staking-towers.repository';

@Injectable()
export class PrismaStakingUnitOfWork implements StakingUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async execute<T>(
    fn: (repos: StakingTransactionalRepositories) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        const stakingTowers = new PrismaStakingTowersRepository(tx);
        return fn({ stakingTowers });
      },
      { timeout: 30000 },
    );
  }
}
