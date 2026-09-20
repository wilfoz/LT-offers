import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  LineFoundationsQueryData,
  LineFoundationsQueryPort,
} from '../../../../domain';

@Injectable()
export class PrismaLineFoundationsQueryAdapter implements LineFoundationsQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findLineFoundationsData(
    lineId: number,
  ): Promise<LineFoundationsQueryData | null> {
    const line = await this.prisma.transmissionLine.findUnique({
      where: { id: lineId },
      include: {
        stakingTowers: {
          include: {
            towerType: true,
            soilType: true,
            foundationType: true,
          },
          orderBy: { stationMeters: 'asc' },
        },
        preliminaryStakingDistribution: true,
      },
    });

    if (!line) {
      return null;
    }

    return {
      id: line.id,
      refinedLengthKm:
        line.refinedLengthKm !== null && line.refinedLengthKm !== undefined
          ? line.refinedLengthKm.toString()
          : null,
      reportLengthKm:
        line.reportLengthKm !== null && line.reportLengthKm !== undefined
          ? line.reportLengthKm.toString()
          : null,
      stakingTowers: line.stakingTowers.map((t: any) => ({
        id: t.id,
        towerNumber: t.towerNumber,
        stationMeters: t.stationMeters.toString(),
        towerTypeId: t.towerTypeId,
        towerCode: t.towerType?.code,
        soilTypeId: t.soilTypeId,
        soilCode: t.soilType?.code,
        foundationTypeId: t.foundationTypeId,
        foundationCode: t.foundationType?.code,
      })),
      preliminaryStakingDistribution: line.preliminaryStakingDistribution
        ? {
            soilPercentages:
              (line.preliminaryStakingDistribution
                .soilPercentages as unknown as Array<{
                id: number;
                percentage: string | number;
              }>) || [],
            foundationPercentages:
              (line.preliminaryStakingDistribution
                .foundationPercentages as unknown as Array<{
                id: number;
                percentage: string | number;
              }>) || [],
          }
        : null,
    };
  }
}
