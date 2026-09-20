import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  PreliminaryDistributionRepository,
  PreliminaryStakingDistribution,
} from '../../../../domain';
import { PrismaStakingMappers } from '../prisma-staking.mapper';

@Injectable()
export class PrismaPreliminaryDistributionRepository implements PreliminaryDistributionRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findByLineId(
    lineId: number,
  ): Promise<PreliminaryStakingDistribution | null> {
    const item = await this.prisma.preliminaryStakingDistribution.findUnique({
      where: { transmissionLineId: lineId },
    });

    return item
      ? PrismaStakingMappers.toPreliminaryStakingDistributionEntity(item)
      : null;
  }

  async save(
    distribution: PreliminaryStakingDistribution,
  ): Promise<PreliminaryStakingDistribution> {
    const soilJson = distribution.soilPercentages.items.map((i) => ({
      id: i.itemId,
      itemId: i.itemId,
      code: i.code,
      name: i.name,
      percentage: i.percentage.toFixed(2),
    }));

    const foundationJson = distribution.foundationPercentages.items.map(
      (i) => ({
        id: i.itemId,
        itemId: i.itemId,
        code: i.code,
        name: i.name,
        percentage: i.percentage.toFixed(2),
      }),
    );

    const saved = await this.prisma.preliminaryStakingDistribution.upsert({
      where: { transmissionLineId: distribution.transmissionLineId },
      create: {
        transmissionLineId: distribution.transmissionLineId,
        soilPercentages: soilJson as unknown as Prisma.InputJsonValue,
        foundationPercentages:
          foundationJson as unknown as Prisma.InputJsonValue,
      },
      update: {
        soilPercentages: soilJson as unknown as Prisma.InputJsonValue,
        foundationPercentages:
          foundationJson as unknown as Prisma.InputJsonValue,
      },
    });

    return PrismaStakingMappers.toPreliminaryStakingDistributionEntity(saved);
  }
}
