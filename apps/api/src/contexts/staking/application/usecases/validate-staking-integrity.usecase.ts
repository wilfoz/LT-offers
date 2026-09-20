import { Inject, Injectable } from '@nestjs/common';
import { StakingInvalidCombinationDetail } from '@lt-offers/domain';
import {
  StakingTowersRepository,
  StakingCatalogQueryPort,
  STAKING_TOWERS_REPOSITORY_TOKEN,
  STAKING_CATALOG_QUERY_PORT_TOKEN,
  StakingIntegrityReport,
} from '../../domain';

@Injectable()
export class ValidateStakingIntegrityUseCase {
  constructor(
    @Inject(STAKING_TOWERS_REPOSITORY_TOKEN)
    private readonly towersRepo: StakingTowersRepository,
    @Inject(STAKING_CATALOG_QUERY_PORT_TOKEN)
    private readonly catalogQuery: StakingCatalogQueryPort,
  ) {}

  async execute(lineId: number): Promise<StakingIntegrityReport> {
    const line = await this.catalogQuery.ensureTransmissionLineExists(lineId);

    const [towers, validMatrixSet] = await Promise.all([
      this.towersRepo.findManyByLineId(lineId),
      this.catalogQuery.findValidFoundationVolumeCombinations(),
    ]);

    let unassignedSoilCount = 0;
    let unassignedFoundationCount = 0;
    const invalidCombinations: StakingInvalidCombinationDetail[] = [];

    let maxStationMeters = 0;

    for (const t of towers) {
      const sm = t.station.meters;
      if (sm > maxStationMeters) {
        maxStationMeters = sm;
      }

      if (!t.soilTypeId) {
        unassignedSoilCount++;
      }
      if (!t.foundationTypeId) {
        unassignedFoundationCount++;
      }

      if (t.soilTypeId && t.foundationTypeId) {
        const key = `${t.soilTypeId}:${t.foundationTypeId}`;
        if (!validMatrixSet.has(key)) {
          invalidCombinations.push({
            towerNumber: t.towerNumber,
            stationMeters: t.station.toMetersString(2),
            soilId: t.soilTypeId,
            soilCode: t.soilType?.code || '',
            soilName: t.soilType?.name || t.soilType?.code || '',
            foundationId: t.foundationTypeId,
            foundationCode: t.foundationType?.code || '',
            foundationName:
              t.foundationType?.name || t.foundationType?.code || '',
            message: `A combinação de solo '${t.soilType?.code}' e fundação '${t.foundationType?.code}' não possui matriz de volumes cadastrada no catálogo.`,
          });
        }
      }
    }

    const totalStationLengthKm = (maxStationMeters / 1000).toFixed(3);
    const lineRefinedLengthKm = Number(line.refinedLengthKm).toFixed(3);

    let lengthDiscrepancyKm: string | null = null;
    const diff = Math.abs(
      maxStationMeters / 1000 - Number(line.refinedLengthKm),
    );
    if (diff > 0.05) {
      lengthDiscrepancyKm = diff.toFixed(3);
    }

    return new StakingIntegrityReport({
      totalTowers: towers.length,
      unassignedSoilCount,
      unassignedFoundationCount,
      invalidCombinations,
      totalStationLengthKm,
      lineRefinedLengthKm,
      lengthDiscrepancyKm,
    });
  }
}
