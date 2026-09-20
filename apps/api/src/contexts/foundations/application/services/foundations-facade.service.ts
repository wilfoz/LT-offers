import {
  FoundationCalculationResult,
  FoundationTraceabilityItem,
  FoundationVolumeQuantityField,
  LineFoundationSummary,
} from '@lt-offers/domain';
import { Injectable } from '@nestjs/common';
import { FoundationValidationDiagnostic } from '../../domain';
import { CalculateLineFoundationsUseCase } from '../usecases/calculate-line-foundations.usecase';
import { GetLineFoundationSummaryUseCase } from '../usecases/get-line-foundation-summary.usecase';
import { GetLineFoundationTraceabilityUseCase } from '../usecases/get-line-foundation-traceability.usecase';
import { GetLineFoundationValidationUseCase } from '../usecases/get-line-foundation-validation.usecase';

/**
 * Facade de aplicação para o contexto de fundações, facilitando a injeção em outros contextos.
 */
@Injectable()
export class FoundationsFacadeService {
  constructor(
    private readonly calculateUseCase: CalculateLineFoundationsUseCase,
    private readonly getSummaryUseCase: GetLineFoundationSummaryUseCase,
    private readonly getTraceabilityUseCase: GetLineFoundationTraceabilityUseCase,
    private readonly getValidationUseCase: GetLineFoundationValidationUseCase,
  ) {}

  async calculateFoundationsForLine(
    lineId: number,
  ): Promise<FoundationCalculationResult> {
    const calc = await this.calculateUseCase.execute(lineId);
    return calc.result;
  }

  async getLineFoundationSummary(
    lineId: number,
  ): Promise<LineFoundationSummary> {
    return this.getSummaryUseCase.execute(lineId);
  }

  async getLineFoundationTraceability(
    lineId: number,
  ): Promise<
    Record<FoundationVolumeQuantityField, FoundationTraceabilityItem>
  > {
    return this.getTraceabilityUseCase.execute(lineId);
  }

  async getLineFoundationValidation(
    lineId: number,
  ): Promise<FoundationValidationDiagnostic> {
    return this.getValidationUseCase.execute(lineId);
  }
}
