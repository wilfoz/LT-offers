import { Inject, Injectable } from '@nestjs/common';
import { AccessDifficulty, PlsCaddCommitPayload } from '@lt-offers/domain';
import {
  StakingCatalogQueryPort,
  StakingUnitOfWork,
  STAKING_CATALOG_QUERY_PORT_TOKEN,
  STAKING_UNIT_OF_WORK_TOKEN,
  StakingTower,
  Station,
  DeflectionAngle,
  CoordinatesUtm,
  PlsCaddImportResult,
  PlsCaddParsingException,
} from '../../domain';

@Injectable()
export class CommitPlsCaddImportUseCase {
  constructor(
    @Inject(STAKING_CATALOG_QUERY_PORT_TOKEN)
    private readonly catalogQuery: StakingCatalogQueryPort,
    @Inject(STAKING_UNIT_OF_WORK_TOKEN)
    private readonly unitOfWork: StakingUnitOfWork,
  ) {}

  async execute(
    lineId: number,
    payload: PlsCaddCommitPayload,
  ): Promise<PlsCaddImportResult> {
    await this.catalogQuery.ensureTransmissionLineExists(lineId);

    if (!payload.rows || payload.rows.length === 0) {
      throw new PlsCaddParsingException('Nenhuma linha para importar.');
    }

    const { towerTypeMap, soilTypeMap, foundationTypeMap } =
      await this.catalogQuery.findCatalogCodes();

    return this.unitOfWork.execute(async ({ stakingTowers }) => {
      const existingTowers = await stakingTowers.findManyByLineId(lineId);
      const existingMap = new Map(
        existingTowers.map((t) => [t.towerNumber.toUpperCase(), t]),
      );

      let importedCount = 0;
      let updatedCount = 0;
      let preservedCount = 0;

      const incomingTowerNumbers = new Set<string>();

      for (const row of payload.rows) {
        const upperNumber = row.towerNumber.trim().toUpperCase();
        incomingTowerNumbers.add(upperNumber);

        const existing = existingMap.get(upperNumber);

        const towerTypeIdFromCode = row.towerTypeCode
          ? (towerTypeMap.get(row.towerTypeCode.trim().toUpperCase()) ?? null)
          : null;
        const soilTypeIdFromCode = row.soilTypeCode
          ? (soilTypeMap.get(row.soilTypeCode.trim().toUpperCase()) ?? null)
          : null;
        const foundationTypeIdFromCode = row.foundationTypeCode
          ? (foundationTypeMap.get(
              row.foundationTypeCode.trim().toUpperCase(),
            ) ?? null)
          : null;

        const station = new Station(Number(row.stationMeters));
        const deflection = new DeflectionAngle(
          Number(row.deflectionAngleDeg ?? 0),
        );
        const coordinates = new CoordinatesUtm({
          utmEast: row.utmEast ? Number(row.utmEast) : null,
          utmNorth: row.utmNorth ? Number(row.utmNorth) : null,
          elevationMeters: row.elevationMeters
            ? Number(row.elevationMeters)
            : null,
        });

        if (existing) {
          const shouldPreserve = payload.preserveExistingAssignments !== false;

          const finalTowerTypeId =
            towerTypeIdFromCode ??
            (shouldPreserve ? existing.towerTypeId : null);
          const finalSoilTypeId =
            soilTypeIdFromCode ?? (shouldPreserve ? existing.soilTypeId : null);
          const finalFoundationTypeId =
            foundationTypeIdFromCode ??
            (shouldPreserve ? existing.foundationTypeId : null);

          if (
            shouldPreserve &&
            (existing.soilTypeId !== null ||
              existing.foundationTypeId !== null ||
              existing.notes !== null)
          ) {
            preservedCount++;
          }

          existing.update({
            towerNumber: row.towerNumber.trim(),
            station,
            bodyExtensionMeters: Number(row.bodyExtensionMeters ?? 0),
            deflectionAngle: deflection,
            lateralOffsetMeters: Number(row.lateralOffsetMeters ?? 0),
            coordinates,
            towerTypeId: finalTowerTypeId,
            soilTypeId: finalSoilTypeId,
            foundationTypeId: finalFoundationTypeId,
          });

          await stakingTowers.update(existing.id!, existing);
          updatedCount++;
        } else {
          const newTower = new StakingTower({
            transmissionLineId: lineId,
            towerNumber: row.towerNumber.trim(),
            station,
            bodyExtensionMeters: Number(row.bodyExtensionMeters ?? 0),
            deflectionAngle: deflection,
            lateralOffsetMeters: Number(row.lateralOffsetMeters ?? 0),
            coordinates,
            towerTypeId: towerTypeIdFromCode,
            soilTypeId: soilTypeIdFromCode,
            foundationTypeId: foundationTypeIdFromCode,
            accessDifficulty: 'NORMAL',
          });

          await stakingTowers.save(newTower);
          importedCount++;
        }
      }

      const toDeleteIds = existingTowers
        .filter((t) => !incomingTowerNumbers.has(t.towerNumber.toUpperCase()))
        .map((t) => t.id!)
        .filter((id): id is number => id !== undefined);

      if (toDeleteIds.length > 0) {
        await stakingTowers.deleteManyByIds(toDeleteIds);
      }

      return new PlsCaddImportResult({
        importedCount,
        updatedCount,
        preservedCount,
      });
    });
  }
}
