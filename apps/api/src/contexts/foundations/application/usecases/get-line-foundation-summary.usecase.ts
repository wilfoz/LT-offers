import { LineFoundationSummary } from '@lt-offers/domain';
import { Injectable } from '@nestjs/common';
import { CalculateLineFoundationsUseCase } from './calculate-line-foundations.usecase';

@Injectable()
export class GetLineFoundationSummaryUseCase {
  constructor(
    private readonly calculateUseCase: CalculateLineFoundationsUseCase,
  ) {}

  /**
   * Retorna o resumo consolidado dos quantitativos da linha de transmissão.
   */
  async execute(lineId: number): Promise<LineFoundationSummary> {
    const calculation = await this.calculateUseCase.execute(lineId);
    return calculation.summary;
  }
}
