import {
  FoundationCalculationResult,
  FoundationTraceabilityItem,
  FoundationVolumeQuantityField,
  LineFoundationSummary,
  MissingFoundationCombination,
} from '@lt-offers/domain';
import { FoundationValidationDiagnostic } from '../value-objects/foundation-validation-diagnostic.vo';

/**
 * Entidade de Domínio que encapsula o resultado e comportamento do cálculo de fundações de uma LT.
 */
export class LineFoundationCalculation {
  constructor(
    public readonly lineId: number,
    public readonly result: FoundationCalculationResult,
  ) {}

  get summary(): LineFoundationSummary {
    return this.result.summary;
  }

  get traceability(): Record<
    FoundationVolumeQuantityField,
    FoundationTraceabilityItem
  > {
    return this.result.traceability;
  }

  get totalTowers(): number {
    return this.result.summary.totalTowers;
  }

  get calculatedTowers(): number {
    return this.result.summary.calculatedTowers;
  }

  get pendingTowers(): number {
    return this.result.summary.pendingTowers;
  }

  get missingCombinations(): MissingFoundationCombination[] {
    return this.result.summary.missingCombinations;
  }

  get hasErrors(): boolean {
    return this.pendingTowers > 0 || this.missingCombinations.length > 0;
  }

  getDiagnostic(): FoundationValidationDiagnostic {
    return FoundationValidationDiagnostic.create({
      transmissionLineId: this.lineId,
      totalTowers: this.totalTowers,
      calculatedTowers: this.calculatedTowers,
      pendingTowers: this.pendingTowers,
      missingCombinations: this.missingCombinations,
    });
  }
}
