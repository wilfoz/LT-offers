import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  StakingCatalogQueryPort,
  TransmissionLineInfo,
} from '../../../../domain';

@Injectable()
export class PrismaStakingCatalogQueryAdapter implements StakingCatalogQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async ensureTransmissionLineExists(
    lineId: number,
  ): Promise<TransmissionLineInfo> {
    const line = await this.prisma.transmissionLine.findUnique({
      where: { id: lineId },
      select: { id: true, refinedLengthKm: true },
    });

    if (!line) {
      throw new NotFoundException(
        `Linha de transmissão #${lineId} não encontrada.`,
      );
    }

    return {
      id: line.id,
      refinedLengthKm: line.refinedLengthKm
        ? line.refinedLengthKm.toString()
        : '0',
    };
  }

  async findCatalogCodes(): Promise<{
    towerTypeMap: Map<string, number>;
    soilTypeMap: Map<string, number>;
    foundationTypeMap: Map<string, number>;
  }> {
    const [towerTypes, soilTypes, foundationTypes] = await Promise.all([
      this.prisma.towerType.findMany({ select: { id: true, code: true } }),
      this.prisma.soilType.findMany({ select: { id: true, code: true } }),
      this.prisma.foundationType.findMany({ select: { id: true, code: true } }),
    ]);

    return {
      towerTypeMap: new Map(
        towerTypes.map((t) => [t.code.toUpperCase(), t.id]),
      ),
      soilTypeMap: new Map(soilTypes.map((s) => [s.code.toUpperCase(), s.id])),
      foundationTypeMap: new Map(
        foundationTypes.map((f) => [f.code.toUpperCase(), f.id]),
      ),
    };
  }

  async findValidFoundationVolumeCombinations(): Promise<Set<string>> {
    const matrices = await this.prisma.foundationVolume.findMany({
      select: {
        soilTypeId: true,
        foundationTypeId: true,
      },
    });

    return new Set(
      matrices.map((m) => `${m.soilTypeId}:${m.foundationTypeId}`),
    );
  }
}
