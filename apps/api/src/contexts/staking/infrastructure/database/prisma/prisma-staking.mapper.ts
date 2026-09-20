import {
  StakingTower as PrismaStakingTower,
  PreliminaryStakingDistribution as PrismaPreliminaryStakingDistribution,
  TowerType as PrismaTowerType,
  SoilType as PrismaSoilType,
  FoundationType as PrismaFoundationType,
} from '@prisma/client';
import { AccessDifficulty } from '@lt-offers/domain';
import {
  StakingTower,
  PreliminaryStakingDistribution,
  Station,
  DeflectionAngle,
  CoordinatesUtm,
  PreliminaryPercentages,
} from '../../../domain';

export type PrismaStakingTowerWithRelations = PrismaStakingTower & {
  towerType?: Pick<PrismaTowerType, 'id' | 'code'> | null;
  soilType?: Pick<PrismaSoilType, 'id' | 'code'> | null;
  foundationType?: Pick<PrismaFoundationType, 'id' | 'code'> | null;
};

export class PrismaStakingMappers {
  static toStakingTowerEntity(
    row: PrismaStakingTowerWithRelations,
  ): StakingTower {
    return new StakingTower({
      id: row.id,
      transmissionLineId: row.transmissionLineId,
      towerNumber: row.towerNumber,
      station: new Station(Number(row.stationMeters)),
      bodyExtensionMeters: Number(row.bodyExtensionMeters),
      deflectionAngle: new DeflectionAngle(Number(row.deflectionAngleDeg)),
      lateralOffsetMeters: Number(row.lateralOffsetMeters),
      coordinates: new CoordinatesUtm({
        utmEast: row.utmEast ? Number(row.utmEast) : null,
        utmNorth: row.utmNorth ? Number(row.utmNorth) : null,
        elevationMeters: row.elevationMeters
          ? Number(row.elevationMeters)
          : null,
      }),
      towerTypeId: row.towerTypeId,
      soilTypeId: row.soilTypeId,
      foundationTypeId: row.foundationTypeId,
      accessDifficulty: (row.accessDifficulty as AccessDifficulty) || 'NORMAL',
      notes: row.notes,
      towerType: row.towerType
        ? {
            id: row.towerType.id,
            code: row.towerType.code,
            name: row.towerType.code,
          }
        : null,
      soilType: row.soilType
        ? {
            id: row.soilType.id,
            code: row.soilType.code,
            name: row.soilType.code,
          }
        : null,
      foundationType: row.foundationType
        ? {
            id: row.foundationType.id,
            code: row.foundationType.code,
            name: row.foundationType.code,
          }
        : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPreliminaryStakingDistributionEntity(
    row: PrismaPreliminaryStakingDistribution,
  ): PreliminaryStakingDistribution {
    const rawSoil = Array.isArray(row.soilPercentages)
      ? (row.soilPercentages as Array<{
          id?: number;
          itemId?: number;
          code?: string;
          name?: string;
          percentage: number | string;
        }>)
      : [];

    const rawFoundation = Array.isArray(row.foundationPercentages)
      ? (row.foundationPercentages as Array<{
          id?: number;
          itemId?: number;
          code?: string;
          name?: string;
          percentage: number | string;
        }>)
      : [];

    const soilPercentages = new PreliminaryPercentages(
      rawSoil.map((item) => ({
        itemId: item.itemId ?? item.id ?? 0,
        code: item.code ?? '',
        name: item.name ?? '',
        percentage: item.percentage,
      })),
    );

    const foundationPercentages = new PreliminaryPercentages(
      rawFoundation.map((item) => ({
        itemId: item.itemId ?? item.id ?? 0,
        code: item.code ?? '',
        name: item.name ?? '',
        percentage: item.percentage,
      })),
    );

    return new PreliminaryStakingDistribution({
      id: row.id,
      transmissionLineId: row.transmissionLineId,
      soilPercentages,
      foundationPercentages,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
