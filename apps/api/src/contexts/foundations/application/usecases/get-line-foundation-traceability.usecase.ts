import {
  FoundationTraceabilityItem,
  FoundationVolumeQuantityField,
} from '@lt-offers/domain';
import { Injectable } from '@nestjs/common';
import { CalculateLineFoundationsUseCase } from './calculate-line-foundations.usecase';

@Injectable()
export class GetLineFoundationTraceabilityUseCase {
  constructor(
    private readonly calculateUseCase: CalculateLineFoundationsUseCase,
  ) {}

  /**
   * Retorna a rastreabilidade item a item dos quantitativos da linha (RF-27).
   */
  async execute(
    lineId: number,
  ): Promise<
    Record<FoundationVolumeQuantityField, FoundationTraceabilityItem>
  > {
    const calculation = await this.calculateUseCase.execute(lineId);
    return calculation.traceability;
  }
}
