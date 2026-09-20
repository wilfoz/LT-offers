import { Inject, Injectable } from '@nestjs/common';
import { AccessDifficulty, StakingTowerInput } from '@lt-offers/domain';
import {
  StakingTowersRepository,
  StakingCatalogQueryPort,
  STAKING_TOWERS_REPOSITORY_TOKEN,
  STAKING_CATALOG_QUERY_PORT_TOKEN,
  StakingTower,
  Station,
  DeflectionAngle,
  CoordinatesUtm,
  DuplicateTowerNumberException,
} from '../../domain';

@Injectable()
export class CreateStakingTowerUseCase {
  constructor(
    @Inject(STAKING_TOWERS_REPOSITORY_TOKEN)
    private readonly towersRepo: StakingTowersRepository,
    @Inject(STAKING_CATALOG_QUERY_PORT_TOKEN)
    private readonly catalogQuery: StakingCatalogQueryPort,
  ) {}

  async execute(
    lineId: number,
    input: StakingTowerInput,
  ): Promise<StakingTower> {
    await this.catalogQuery.ensureTransmissionLineExists(lineId);

    const trimmedNumber = input.towerNumber.trim();
    const duplicate = await this.towersRepo.findByTowerNumber(
      lineId,
      trimmedNumber,
    );

    if (duplicate) {
      throw new DuplicateTowerNumberException(trimmedNumber);
    }

    const station = new Station(Number(input.stationMeters));
    const deflection = new DeflectionAngle(
      Number(input.deflectionAngleDeg ?? 0),
    );
    const coordinates = new CoordinatesUtm({
      utmEast: input.utmEast ? Number(input.utmEast) : null,
      utmNorth: input.utmNorth ? Number(input.utmNorth) : null,
      elevationMeters: input.elevationMeters
        ? Number(input.elevationMeters)
        : null,
    });

    const tower = new StakingTower({
      transmissionLineId: lineId,
      towerNumber: trimmedNumber,
      station,
      bodyExtensionMeters: Number(input.bodyExtensionMeters ?? 0),
      deflectionAngle: deflection,
      lateralOffsetMeters: Number(input.lateralOffsetMeters ?? 0),
      coordinates,
      towerTypeId: input.towerTypeId ?? null,
      soilTypeId: input.soilTypeId ?? null,
      foundationTypeId: input.foundationTypeId ?? null,
      accessDifficulty:
        (input.accessDifficulty as AccessDifficulty) ?? 'NORMAL',
      notes: input.notes?.trim() || null,
    });

    return this.towersRepo.save(tower);
  }
}
