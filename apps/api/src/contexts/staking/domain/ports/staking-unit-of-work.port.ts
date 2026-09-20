import { StakingTowersRepository } from './staking-towers.repository.port';

export interface StakingTransactionalRepositories {
  stakingTowers: StakingTowersRepository;
}

export interface StakingUnitOfWork {
  execute<T>(
    fn: (repos: StakingTransactionalRepositories) => Promise<T>,
  ): Promise<T>;
}
