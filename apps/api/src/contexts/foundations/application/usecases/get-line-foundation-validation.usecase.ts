import { Injectable } from '@nestjs/common';
import { FoundationValidationDiagnostic } from '../../domain';
import { CalculateLineFoundationsUseCase } from './calculate-line-foundations.usecase';

@Injectable()
export class GetLineFoundationValidationUseCase {
  constructor(
    private readonly calculateUseCase: CalculateLineFoundationsUseCase,
  ) {}

  /**
   * Retorna o diagnóstico de integridade geotécnica e combinações pendentes da linha (RF-20).
   */
  async execute(lineId: number): Promise<FoundationValidationDiagnostic> {
    const calculation = await this.calculateUseCase.execute(lineId);
    return calculation.getDiagnostic();
  }
}
