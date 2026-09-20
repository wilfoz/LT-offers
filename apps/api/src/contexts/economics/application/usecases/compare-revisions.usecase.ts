import { Injectable } from '@nestjs/common';
import { RevisionComparisonResult } from '@lt-offers/domain';
import { EconomicResultCalculator } from '@lt-offers/calc-engine';
import { GetConsolidatedEconomicResultUseCase } from './get-consolidated-economic-result.usecase';

@Injectable()
export class CompareRevisionsUseCase {
  constructor(
    private readonly getConsolidatedEconomicResult: GetConsolidatedEconomicResultUseCase,
  ) {}

  /**
   * Comparação entre revisões da oferta (comportamento herdado do legado:
   * margens de referência 8% vs 10% sobre o consolidado atual).
   */
  async execute(
    offerId: number,
    baseRevNum: number,
    targetRevNum: number,
  ): Promise<RevisionComparisonResult> {
    const baseSummary = await this.getConsolidatedEconomicResult.execute(
      offerId,
      { targetMarginRate: '8.00' },
    );
    const targetSummary = await this.getConsolidatedEconomicResult.execute(
      offerId,
      { targetMarginRate: '10.00' },
    );

    return EconomicResultCalculator.compareRevisions(
      baseSummary,
      targetSummary,
      baseRevNum,
      targetRevNum,
    );
  }
}
