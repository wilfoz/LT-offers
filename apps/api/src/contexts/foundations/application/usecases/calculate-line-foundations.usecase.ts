import {
  FoundationCalculationInput,
  TowerCalculationData,
} from '@lt-offers/domain';
import { calculateLineFoundations } from '@lt-offers/calc-engine';
import { Inject, Injectable } from '@nestjs/common';
import {
  LineFoundationCalculation,
  LineFoundationsNotFoundException,
  LineFoundationsQueryPort,
  FoundationVolumeMatricesQueryPort,
  LINE_FOUNDATIONS_QUERY_PORT_TOKEN,
  FOUNDATION_VOLUME_MATRICES_QUERY_PORT_TOKEN,
} from '../../domain';

@Injectable()
export class CalculateLineFoundationsUseCase {
  constructor(
    @Inject(LINE_FOUNDATIONS_QUERY_PORT_TOKEN)
    private readonly lineQueryPort: LineFoundationsQueryPort,
    @Inject(FOUNDATION_VOLUME_MATRICES_QUERY_PORT_TOKEN)
    private readonly matricesQueryPort: FoundationVolumeMatricesQueryPort,
  ) {}

  /**
   * Executa o cálculo completo de quantitativos de fundações para uma linha de transmissão.
   */
  async execute(lineId: number): Promise<LineFoundationCalculation> {
    const line = await this.lineQueryPort.findLineFoundationsData(lineId);

    if (!line) {
      throw new LineFoundationsNotFoundException(lineId);
    }

    // 1. Carregar matrizes de volume de fundação vigentes
    const volumeMatrices =
      await this.matricesQueryPort.loadEffectiveVolumeMatrices();

    // 2. Montar input de cálculo
    let towersData: TowerCalculationData[] | undefined;
    let preliminaryInput:
      FoundationCalculationInput['preliminaryDistribution'] | undefined;

    if (line.stakingTowers && line.stakingTowers.length > 0) {
      towersData = line.stakingTowers.map((t) => ({
        id: t.id,
        towerNumber: t.towerNumber,
        stationMeters: t.stationMeters.toString(),
        towerTypeId: t.towerTypeId,
        towerCode: t.towerCode,
        soilTypeId: t.soilTypeId,
        soilCode: t.soilCode,
        foundationTypeId: t.foundationTypeId,
        foundationCode: t.foundationCode,
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

    const calculationResult = calculateLineFoundations(calcInput);
    return new LineFoundationCalculation(lineId, calculationResult);
  }
}
