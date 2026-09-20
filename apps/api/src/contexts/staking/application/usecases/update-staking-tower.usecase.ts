import { Inject, Injectable } from '@nestjs/common';
import { AccessDifficulty, StakingTowerInput } from '@lt-offers/domain';
import {
  StakingTowersRepository,
  STAKING_TOWERS_REPOSITORY_TOKEN,
  StakingTower,
  Station,
  DeflectionAngle,
  CoordinatesUtm,
  StakingTowerNotFoundException,
  DuplicateTowerNumberException,
} from '../../domain';

@Injectable()
export class UpdateStakingTowerUseCase {
  constructor(
    @Inject(STAKING_TOWERS_REPOSITORY_TOKEN)
    private readonly towersRepo: StakingTowersRepository,
  ) {}

  async execute(
    lineId: number,
    towerId: number,
    data: Partial<StakingTowerInput>,
  ): Promise<StakingTower> {
    const existing = await this.towersRepo.findById(towerId);

    if (!existing || existing.transmissionLineId !== lineId) {
      throw new StakingTowerNotFoundException(towerId, lineId);
    }

    if (data.towerNumber && data.towerNumber.trim() !== existing.towerNumber) {
      const duplicate = await this.towersRepo.findByTowerNumber(
        lineId,
        data.towerNumber.trim(),
      );
      if (duplicate && duplicate.id !== towerId) {
        throw new DuplicateTowerNumberException(data.towerNumber.trim());
      }
    }

    const station =
      data.stationMeters !== undefined
        ? new Station(Number(data.stationMeters))
        : undefined;

    const deflection =
      data.deflectionAngleDeg !== undefined
        ? new DeflectionAngle(Number(data.deflectionAngleDeg))
        : undefined;

    let coordinates: CoordinatesUtm | undefined = undefined;
    if (
      data.utmEast !== undefined ||
      data.utmNorth !== undefined ||
      data.elevationMeters !== undefined
    ) {
      coordinates = new CoordinatesUtm({
        utmEast:
          data.utmEast !== undefined
            ? data.utmEast
              ? Number(data.utmEast)
              : null
            : existing.coordinates.utmEast,
        utmNorth:
          data.utmNorth !== undefined
            ? data.utmNorth
              ? Number(data.utmNorth)
              : null
            : existing.coordinates.utmNorth,
        elevationMeters:
          data.elevationMeters !== undefined
            ? data.elevationMeters
              ? Number(data.elevationMeters)
              : null
            : existing.coordinates.elevationMeters,
      });
    }

    existing.update({
      towerNumber: data.towerNumber,
      station,
      bodyExtensionMeters:
        data.bodyExtensionMeters !== undefined
          ? Number(data.bodyExtensionMeters)
          : undefined,
      deflectionAngle: deflection,
      lateralOffsetMeters:
        data.lateralOffsetMeters !== undefined
          ? Number(data.lateralOffsetMeters)
          : undefined,
      coordinates,
      towerTypeId: data.towerTypeId,
      soilTypeId: data.soilTypeId,
      foundationTypeId: data.foundationTypeId,
      accessDifficulty: data.accessDifficulty as AccessDifficulty,
      notes: data.notes,
    });

    return this.towersRepo.update(towerId, existing);
  }
}
