import { MissingFoundationCombination } from '@lt-offers/domain';

/**
 * Value Object representando o diagnóstico de integridade geotécnica de fundações da linha (RF-20).
 */
export class FoundationValidationDiagnostic {
  constructor(
    public readonly transmissionLineId: number,
    public readonly totalTowers: number,
    public readonly calculatedTowers: number,
    public readonly pendingTowers: number,
    public readonly hasErrors: boolean,
    public readonly missingCombinations: MissingFoundationCombination[],
  ) {}

  static create(params: {
    transmissionLineId: number;
    totalTowers: number;
    calculatedTowers: number;
    pendingTowers: number;
    missingCombinations: MissingFoundationCombination[];
  }): FoundationValidationDiagnostic {
    const hasErrors =
      params.pendingTowers > 0 || params.missingCombinations.length > 0;

    return new FoundationValidationDiagnostic(
      params.transmissionLineId,
      params.totalTowers,
      params.calculatedTowers,
      params.pendingTowers,
      hasErrors,
      [...params.missingCombinations],
    );
  }
}
