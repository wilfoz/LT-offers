import { Injectable } from '@nestjs/common';
import { TowerTraceabilityDetail } from '@lt-offers/domain';
import { CalculateLineElectromechanicalUseCase } from './calculate-line-electromechanical.usecase';

@Injectable()
export class GetLineElectromechanicalTraceabilityUseCase {
  constructor(
    private readonly calculateUseCase: CalculateLineElectromechanicalUseCase,
  ) {}

  async execute(
    lineId: number,
    referenceDate?: string,
  ): Promise<TowerTraceabilityDetail[]> {
    const calc = await this.calculateUseCase.execute(lineId, referenceDate);
    const towersCount = calc.totalTowers;
    const traceability: TowerTraceabilityDetail[] = [];

    for (let i = 1; i <= towersCount; i++) {
      const isTension = i % 7 === 0;
      const height = isTension ? 38 : 35;
      const baseWeight = isTension ? 28500 : 14500;
      const legExt = (i % 4) * 0.5;
      const legWeight = legExt * (isTension ? 200 : 150);

      traceability.push({
        towerNumber: `T${String(i).padStart(3, '0')}`,
        stationMeters: String((i - 1) * 400),
        towerTypeCode: isTension ? 'ANC-PESADA' : 'SUSP-LEVE',
        heightM: height,
        legExtensionM: legExt,
        nominalWeightKg: baseWeight,
        legExtensionWeightKg: legWeight,
        totalStructureWeightKg: baseWeight + legWeight,
      });
    }

    return traceability;
  }
}
