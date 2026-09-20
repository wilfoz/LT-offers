import { Injectable } from '@nestjs/common';
import {
  MarginSimulationInput,
  MarginSimulationOutput,
} from '@lt-offers/domain';
import { EconomicResultCalculator } from '@lt-offers/calc-engine';
import { GetLineEconomicResultUseCase } from './get-line-economic-result.usecase';
import { GetConsolidatedEconomicResultUseCase } from './get-consolidated-economic-result.usecase';

@Injectable()
export class SimulateMarginOrPriceUseCase {
  constructor(
    private readonly getLineEconomicResult: GetLineEconomicResultUseCase,
    private readonly getConsolidatedEconomicResult: GetConsolidatedEconomicResultUseCase,
  ) {}

  /**
   * Simulação interativa de preço/margem sobre o resultado da linha ou o
   * consolidado da oferta.
   */
  async execute(
    offerId: number,
    simInput: MarginSimulationInput,
    lineId?: number,
  ): Promise<MarginSimulationOutput> {
    const summary = lineId
      ? await this.getLineEconomicResult.execute(lineId)
      : await this.getConsolidatedEconomicResult.execute(offerId);

    return EconomicResultCalculator.simulateMarginOrPrice(summary, simInput);
  }
}
