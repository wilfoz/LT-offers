import {
  PaginatedStakingTowers,
  PreliminaryPercentageItem,
  PreliminaryStakingDistributionItem,
  StakingTowerItem,
  StakingValidationSummary,
} from '@lt-offers/domain';
import {
  StakingTower,
  PreliminaryStakingDistribution,
  StakingIntegrityReport,
  PlsCaddImportResult,
  PaginatedStakingTowersResult,
} from '../../../domain';

export class StakingPresenter {
  static toStakingTowerItem(t: StakingTower): StakingTowerItem {
    return {
      id: t.id ?? 0,
      transmissionLineId: t.transmissionLineId,
      towerNumber: t.towerNumber,
      stationMeters: t.station.toMetersString(2),
      bodyExtensionMeters: t.bodyExtensionMeters.toFixed(2),
      deflectionAngleDeg: t.deflectionAngle.toDegreesString(2),
      lateralOffsetMeters: t.lateralOffsetMeters.toFixed(2),
      utmEast: t.coordinates.eastString,
      utmNorth: t.coordinates.northString,
      elevationMeters: t.coordinates.elevationString,
      towerTypeId: t.towerTypeId,
      soilTypeId: t.soilTypeId,
      foundationTypeId: t.foundationTypeId,
      accessDifficulty: t.accessDifficulty,
      notes: t.notes,
      towerType: t.towerType
        ? {
            id: t.towerType.id,
            code: t.towerType.code,
            name: t.towerType.name,
          }
        : null,
      soilType: t.soilType
        ? {
            id: t.soilType.id,
            code: t.soilType.code,
            name: t.soilType.name,
          }
        : null,
      foundationType: t.foundationType
        ? {
            id: t.foundationType.id,
            code: t.foundationType.code,
            name: t.foundationType.name,
          }
        : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  static toPaginatedStakingTowers(
    result: PaginatedStakingTowersResult,
  ): PaginatedStakingTowers {
    return {
      items: result.items.map((t) => this.toStakingTowerItem(t)),
      totalCount: result.totalCount,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      summary: {
        totalTowers: result.summary.totalTowers,
        minStationMeters: result.summary.minStationMeters,
        maxStationMeters: result.summary.maxStationMeters,
        unassignedSoilCount: result.summary.unassignedSoilCount,
        unassignedFoundationCount: result.summary.unassignedFoundationCount,
        invalidCombinationsCount: result.summary.invalidCombinationsCount,
      },
    };
  }

  static toPreliminaryStakingDistributionItem(
    dist: PreliminaryStakingDistribution,
  ): PreliminaryStakingDistributionItem {
    return {
      id: dist.id ?? 0,
      transmissionLineId: dist.transmissionLineId,
      soilPercentages: dist.soilPercentages.items.map(
        (i): PreliminaryPercentageItem => ({
          id: i.itemId,
          code: i.code,
          name: i.name,
          percentage: i.percentage.toFixed(2),
        }),
      ),
      foundationPercentages: dist.foundationPercentages.items.map(
        (i): PreliminaryPercentageItem => ({
          id: i.itemId,
          code: i.code,
          name: i.name,
          percentage: i.percentage.toFixed(2),
        }),
      ),
      createdAt: dist.createdAt.toISOString(),
      updatedAt: dist.updatedAt.toISOString(),
    };
  }

  static toStakingValidationSummary(
    report: StakingIntegrityReport,
  ): StakingValidationSummary {
    return {
      hasErrors: report.hasErrors,
      totalTowers: report.totalTowers,
      unassignedSoilCount: report.unassignedSoilCount,
      unassignedFoundationCount: report.unassignedFoundationCount,
      invalidCombinationsCount: report.invalidCombinationsCount,
      invalidCombinations: report.invalidCombinations,
      totalStationLengthKm: report.totalStationLengthKm,
      lineRefinedLengthKm: report.lineRefinedLengthKm,
      lengthDiscrepancyKm: report.lengthDiscrepancyKm,
    };
  }

  static toPlsCaddCommitResponse(result: PlsCaddImportResult): {
    importedCount: number;
    updatedCount: number;
    preservedCount: number;
  } {
    return {
      importedCount: result.importedCount,
      updatedCount: result.updatedCount,
      preservedCount: result.preservedCount,
    };
  }
}
