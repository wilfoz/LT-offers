import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../app/prisma.service';
import {
  LineElectromechanicalQueryData,
  LineElectromechanicalQueryPort,
} from '../../domain';

@Injectable()
export class PrismaLineElectromechanicalQueryAdapter implements LineElectromechanicalQueryPort {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findLineElectromechanicalData(
    lineId: number,
  ): Promise<LineElectromechanicalQueryData | null> {
    const line = await (this.prisma as any).transmissionLine.findUnique({
      where: { id: lineId },
      include: {
        offerRevision: {
          include: {
            offer: true,
          },
        },
        stakingTowers: true,
      },
    });

    if (!line) {
      return null;
    }

    return {
      id: line.id,
      name: line.name || `Linha ID ${lineId}`,
      refinedLengthKm:
        line.refinedLengthKm !== null && line.refinedLengthKm !== undefined
          ? line.refinedLengthKm.toString()
          : null,
      reportLengthKm:
        line.reportLengthKm !== null && line.reportLengthKm !== undefined
          ? line.reportLengthKm.toString()
          : null,
      nominalVoltageKv:
        line.nominalVoltageKv !== null && line.nominalVoltageKv !== undefined
          ? line.nominalVoltageKv.toString()
          : null,
      stakingTowers: (line.stakingTowers || []).map((t: any) => ({
        id: t.id,
        towerNumber: t.towerNumber,
        stationMeters: t.stationMeters.toString(),
        towerTypeId: t.towerTypeId,
        towerCode: t.towerCode,
      })),
    };
  }
}
