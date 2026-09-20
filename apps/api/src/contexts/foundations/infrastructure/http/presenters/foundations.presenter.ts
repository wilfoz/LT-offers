import {
  FoundationCalculationResult,
  FoundationTraceabilityItem,
  FoundationVolumeQuantityField,
  LineFoundationSummary,
  MissingFoundationCombination,
} from '@lt-offers/domain';
import {
  FoundationValidationDiagnostic,
  LineFoundationCalculation,
} from '../../../domain';

export interface FoundationValidationResponseDto {
  transmissionLineId: number;
  totalTowers: number;
  calculatedTowers: number;
  pendingTowers: number;
  hasErrors: boolean;
  missingCombinations: MissingFoundationCombination[];
}

export class FoundationsPresenter {
  static toSummaryResponse(
    summary: LineFoundationSummary,
  ): LineFoundationSummary {
    return summary;
  }

  static toTraceabilityResponse(
    traceability: Record<
      FoundationVolumeQuantityField,
      FoundationTraceabilityItem
    >,
  ): Record<FoundationVolumeQuantityField, FoundationTraceabilityItem> {
    return traceability;
  }

  static toValidationResponse(
    diagnostic: FoundationValidationDiagnostic,
  ): FoundationValidationResponseDto {
    return {
      transmissionLineId: diagnostic.transmissionLineId,
      totalTowers: diagnostic.totalTowers,
      calculatedTowers: diagnostic.calculatedTowers,
      pendingTowers: diagnostic.pendingTowers,
      hasErrors: diagnostic.hasErrors,
      missingCombinations: diagnostic.missingCombinations,
    };
  }

  static toFullCalculationResponse(
    calculation: LineFoundationCalculation,
  ): FoundationCalculationResult {
    return calculation.result;
  }
}
