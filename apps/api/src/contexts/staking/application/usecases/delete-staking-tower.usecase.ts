import { Inject, Injectable } from '@nestjs/common';
import {
  StakingTowersRepository,
  STAKING_TOWERS_REPOSITORY_TOKEN,
  StakingTowerNotFoundException,
} from '../../domain';

@Injectable()
export class DeleteStakingTowerUseCase {
  constructor(
    @Inject(STAKING_TOWERS_REPOSITORY_TOKEN)
    private readonly towersRepo: StakingTowersRepository,
  ) {}

  async execute(lineId: number, towerId: number): Promise<void> {
    const existing = await this.towersRepo.findById(towerId);

    if (!existing || existing.transmissionLineId !== lineId) {
      throw new StakingTowerNotFoundException(towerId, lineId);
    }

    await this.towersRepo.delete(towerId);
  }
}
