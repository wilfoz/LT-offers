import { Inject, Injectable } from '@nestjs/common';
import {
  StakingTowersRepository,
  STAKING_TOWERS_REPOSITORY_TOKEN,
  StakingTower,
  StakingTowerNotFoundException,
} from '../../domain';

@Injectable()
export class GetStakingTowerByIdUseCase {
  constructor(
    @Inject(STAKING_TOWERS_REPOSITORY_TOKEN)
    private readonly towersRepo: StakingTowersRepository,
  ) {}

  async execute(lineId: number, towerId: number): Promise<StakingTower> {
    const tower = await this.towersRepo.findById(towerId);

    if (!tower || tower.transmissionLineId !== lineId) {
      throw new StakingTowerNotFoundException(towerId, lineId);
    }

    return tower;
  }
}
