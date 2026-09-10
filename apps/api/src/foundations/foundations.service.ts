import {
  FoundationCalculationInput,
  FoundationCalculationResult,
  FoundationMatrixLookupItem,
  FoundationTraceabilityItem,
  FoundationVolumeQuantities,
  FoundationVolumeQuantityField,
  FOUNDATION_VOLUME_QUANTITY_FIELDS,
  LineFoundationSummary,
  MissingFoundationCombination,
  TowerCalculationData,
} from '@lt-offers/domain';
import { calculateLineFoundations } from '@lt-offers/calc-engine';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';

@Injectable()
export class FoundationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executa o cálculo completo de quantitativos de fundações para a linha.
   */
  async calculateFoundationsForLine(
    lineId: number,
  ): Promise<FoundationCalculationResult> {
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
      throw new NotFoundException(
        `Linha de transmissão com ID ${lineId} não encontrada`,
      );
    }

    // 1. Carregar matrizes de volume de fundação vigentes
    const volumeMatrices = await this.loadEffectiveVolumeMatrices();

    // 2. Montar input de cálculo
    let towersData: TowerCalculationData[] | undefined;
    let preliminaryInput: FoundationCalculationInput['preliminaryDistribution'] | undefined;

    if (line.stakingTowers && line.stakingTowers.length > 0) {
      towersData = line.stakingTowers.map((t) => ({
        id: t.id,
        towerNumber: t.towerNumber,
        stationMeters: t.stationMeters.toString(),
        towerTypeId: t.towerTypeId,
        towerCode: t.towerType?.code,
        soilTypeId: t.soilTypeId,
        soilCode: t.soilType?.code,
        foundationTypeId: t.foundationTypeId,
        foundationCode: t.foundationType?.code,
      }));
    } else if (line.preliminaryStakingDistribution) {
      const dist = line.preliminaryStakingDistribution;
      const soilPercentages =
        (dist.soilPercentages as unknown as Array<{
          id: number;
          percentage: string | number;
        }>) || [];
      const foundationPercentages =
        (dist.foundationPercentages as unknown as Array<{
          id: number;
          percentage: string | number;
        }>) || [];

      // Estimar quantidade de torres: ~ reportLengthKm / 0.400 km (vão médio 400m)
      const lengthKm =
        Number(line.reportLengthKm) || Number(line.refinedLengthKm) || 10;
      const estimatedTowers = Math.max(1, Math.round((lengthKm * 1000) / 400));

      preliminaryInput = {
        totalTowers: estimatedTowers,
        soilPercentages,
        foundationPercentages,
      };
    }

    const calcInput: FoundationCalculationInput = {
      transmissionLineId: line.id,
      towers: towersData,
      preliminaryDistribution: preliminaryInput,
      volumeMatrices,
    };

    return calculateLineFoundations(calcInput);
  }

  /**
   * Retorna o resumo consolidado dos quantitativos da linha.
   */
  async getLineFoundationSummary(lineId: number): Promise<LineFoundationSummary> {
    const result = await this.calculateFoundationsForLine(lineId);
    return result.summary;
  }

  /**
   * Retorna a rastreabilidade item a item da linha (RF-27).
   */
  async getLineFoundationTraceability(
    lineId: number,
  ): Promise<Record<FoundationVolumeQuantityField, FoundationTraceabilityItem>> {
    const result = await this.calculateFoundationsForLine(lineId);
    return result.traceability;
  }

  /**
   * Retorna o diagnóstico geotécnico e validação de combinações da linha (RF-20).
   */
  async getLineFoundationValidation(lineId: number): Promise<{
    transmissionLineId: number;
    totalTowers: number;
    calculatedTowers: number;
    pendingTowers: number;
    hasErrors: boolean;
    missingCombinations: MissingFoundationCombination[];
  }> {
    const result = await this.calculateFoundationsForLine(lineId);
    const hasErrors =
      result.summary.pendingTowers > 0 ||
      result.summary.missingCombinations.length > 0;

    return {
      transmissionLineId: lineId,
      totalTowers: result.summary.totalTowers,
      calculatedTowers: result.summary.calculatedTowers,
      pendingTowers: result.summary.pendingTowers,
      hasErrors,
      missingCombinations: result.summary.missingCombinations,
    };
  }

  /**
   * Carrega todas as matrizes de volume de fundação ativas com a versão mais recente.
   */
  private async loadEffectiveVolumeMatrices(): Promise<
    FoundationMatrixLookupItem[]
  > {
    const volumes = await this.prisma.foundationVolume.findMany({
      include: {
        versions: {
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    const result: FoundationMatrixLookupItem[] = [];

    for (const v of volumes) {
      const latestVersion = v.versions[0];
      if (!latestVersion) continue;

      const quantities = {} as FoundationVolumeQuantities;
      for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
        const val = latestVersion[field];
        quantities[field] =
          val !== null && val !== undefined ? val.toString() : null;
      }

      result.push({
        towerTypeId: v.towerTypeId,
        soilTypeId: v.soilTypeId,
        foundationTypeId: v.foundationTypeId,
        quantities,
      });
    }

    return result;
  }
}
