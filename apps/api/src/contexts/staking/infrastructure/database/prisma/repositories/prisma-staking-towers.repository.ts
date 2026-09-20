import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import { StakingPaginationQuery } from '@lt-offers/domain';
import {
  StakingTowersRepository,
  StakingBatchFilter,
  StakingBatchUpdateData,
  PaginatedStakingTowersResult,
  StakingTower,
  DuplicateTowerNumberException,
} from '../../../../domain';
import {
  PrismaStakingMappers,
  PrismaStakingTowerWithRelations,
} from '../prisma-staking.mapper';

const Decimal = Prisma.Decimal;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

@Injectable()
export class PrismaStakingTowersRepository implements StakingTowersRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<StakingTower | null> {
    const item = await this.prisma.stakingTower.findUnique({
      where: { id },
      include: {
        towerType: { select: { id: true, code: true } },
        soilType: { select: { id: true, code: true } },
        foundationType: { select: { id: true, code: true } },
      },
    });

    return item
      ? PrismaStakingMappers.toStakingTowerEntity(
          item as PrismaStakingTowerWithRelations,
        )
      : null;
  }

  async findByTowerNumber(
    lineId: number,
    towerNumber: string,
  ): Promise<StakingTower | null> {
    const item = await this.prisma.stakingTower.findUnique({
      where: {
        transmissionLineId_towerNumber: {
          transmissionLineId: lineId,
          towerNumber: towerNumber.trim(),
        },
      },
      include: {
        towerType: { select: { id: true, code: true } },
        soilType: { select: { id: true, code: true } },
        foundationType: { select: { id: true, code: true } },
      },
    });

    return item
      ? PrismaStakingMappers.toStakingTowerEntity(
          item as PrismaStakingTowerWithRelations,
        )
      : null;
  }

  async findManyByLineId(lineId: number): Promise<StakingTower[]> {
    const items = await this.prisma.stakingTower.findMany({
      where: { transmissionLineId: lineId },
      include: {
        towerType: { select: { id: true, code: true } },
        soilType: { select: { id: true, code: true } },
        foundationType: { select: { id: true, code: true } },
      },
      orderBy: { stationMeters: 'asc' },
    });

    return items.map((i) =>
      PrismaStakingMappers.toStakingTowerEntity(
        i as PrismaStakingTowerWithRelations,
      ),
    );
  }

  async findPaginated(
    lineId: number,
    query: StakingPaginationQuery,
  ): Promise<PaginatedStakingTowersResult> {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(1000, Math.max(1, query.pageSize || 50));
    const skip = (page - 1) * pageSize;

    const where: Prisma.StakingTowerWhereInput = {
      transmissionLineId: lineId,
    };

    if (query.search?.trim()) {
      where.towerNumber = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    if (query.towerTypeId !== undefined && query.towerTypeId !== null) {
      where.towerTypeId = query.towerTypeId;
    }

    if (query.soilTypeId !== undefined && query.soilTypeId !== null) {
      where.soilTypeId = query.soilTypeId;
    }

    if (
      query.foundationTypeId !== undefined &&
      query.foundationTypeId !== null
    ) {
      where.foundationTypeId = query.foundationTypeId;
    }

    if (query.accessDifficulty) {
      where.accessDifficulty = query.accessDifficulty;
    }

    if (
      query.minStationMeters !== undefined ||
      query.maxStationMeters !== undefined
    ) {
      where.stationMeters = {};
      if (query.minStationMeters !== undefined) {
        where.stationMeters.gte = new Decimal(query.minStationMeters);
      }
      if (query.maxStationMeters !== undefined) {
        where.stationMeters.lte = new Decimal(query.maxStationMeters);
      }
    }

    const orderBy: Prisma.StakingTowerOrderByWithRelationInput =
      query.sortBy === 'towerNumber'
        ? { towerNumber: query.sortDirection || 'asc' }
        : { stationMeters: query.sortDirection || 'asc' };

    const [items, totalCount, allTowersForSummary, matrices] =
      await Promise.all([
        this.prisma.stakingTower.findMany({
          where,
          include: {
            towerType: { select: { id: true, code: true } },
            soilType: { select: { id: true, code: true } },
            foundationType: { select: { id: true, code: true } },
          },
          orderBy,
          skip,
          take: pageSize,
        }),
        this.prisma.stakingTower.count({ where }),
        this.prisma.stakingTower.findMany({
          where: { transmissionLineId: lineId },
          select: {
            stationMeters: true,
            soilTypeId: true,
            foundationTypeId: true,
          },
        }),
        this.prisma.foundationVolume.findMany({
          select: {
            soilTypeId: true,
            foundationTypeId: true,
          },
        }),
      ]);

    const matrixSet = new Set(
      matrices.map(
        (m: { soilTypeId: number; foundationTypeId: number }) =>
          `${m.soilTypeId}:${m.foundationTypeId}`,
      ),
    );

    let minStation = 0;
    let maxStation = 0;
    let unassignedSoilCount = 0;
    let unassignedFoundationCount = 0;
    let invalidCombinationsCount = 0;

    if (allTowersForSummary.length > 0) {
      minStation = Number(allTowersForSummary[0].stationMeters);
      maxStation = Number(allTowersForSummary[0].stationMeters);

      for (const t of allTowersForSummary) {
        const sm = Number(t.stationMeters);
        if (sm < minStation) minStation = sm;
        if (sm > maxStation) maxStation = sm;

        if (t.soilTypeId === null) {
          unassignedSoilCount++;
        }
        if (t.foundationTypeId === null) {
          unassignedFoundationCount++;
        }
        if (
          t.soilTypeId !== null &&
          t.foundationTypeId !== null &&
          !matrixSet.has(`${t.soilTypeId}:${t.foundationTypeId}`)
        ) {
          invalidCombinationsCount++;
        }
      }
    }

    return {
      items: items.map((t) =>
        PrismaStakingMappers.toStakingTowerEntity(
          t as PrismaStakingTowerWithRelations,
        ),
      ),
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize) || 1,
      summary: {
        totalTowers: allTowersForSummary.length,
        minStationMeters: minStation.toFixed(2),
        maxStationMeters: maxStation.toFixed(2),
        unassignedSoilCount,
        unassignedFoundationCount,
        invalidCombinationsCount,
      },
    };
  }

  async save(tower: StakingTower): Promise<StakingTower> {
    try {
      const created = await this.prisma.stakingTower.create({
        data: {
          transmissionLineId: tower.transmissionLineId,
          towerNumber: tower.towerNumber,
          stationMeters: new Decimal(tower.station.meters),
          bodyExtensionMeters: new Decimal(tower.bodyExtensionMeters),
          deflectionAngleDeg: new Decimal(tower.deflectionAngle.degrees),
          lateralOffsetMeters: new Decimal(tower.lateralOffsetMeters),
          utmEast: tower.coordinates.utmEast
            ? new Decimal(tower.coordinates.utmEast)
            : null,
          utmNorth: tower.coordinates.utmNorth
            ? new Decimal(tower.coordinates.utmNorth)
            : null,
          elevationMeters: tower.coordinates.elevationMeters
            ? new Decimal(tower.coordinates.elevationMeters)
            : null,
          towerTypeId: tower.towerTypeId,
          soilTypeId: tower.soilTypeId,
          foundationTypeId: tower.foundationTypeId,
          accessDifficulty: tower.accessDifficulty,
          notes: tower.notes,
        },
        include: {
          towerType: { select: { id: true, code: true } },
          soilType: { select: { id: true, code: true } },
          foundationType: { select: { id: true, code: true } },
        },
      });

      return PrismaStakingMappers.toStakingTowerEntity(
        created as PrismaStakingTowerWithRelations,
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateTowerNumberException(tower.towerNumber);
      }
      throw error;
    }
  }

  async update(id: number, tower: StakingTower): Promise<StakingTower> {
    try {
      const updated = await this.prisma.stakingTower.update({
        where: { id },
        data: {
          towerNumber: tower.towerNumber,
          stationMeters: new Decimal(tower.station.meters),
          bodyExtensionMeters: new Decimal(tower.bodyExtensionMeters),
          deflectionAngleDeg: new Decimal(tower.deflectionAngle.degrees),
          lateralOffsetMeters: new Decimal(tower.lateralOffsetMeters),
          utmEast: tower.coordinates.utmEast
            ? new Decimal(tower.coordinates.utmEast)
            : null,
          utmNorth: tower.coordinates.utmNorth
            ? new Decimal(tower.coordinates.utmNorth)
            : null,
          elevationMeters: tower.coordinates.elevationMeters
            ? new Decimal(tower.coordinates.elevationMeters)
            : null,
          towerTypeId: tower.towerTypeId,
          soilTypeId: tower.soilTypeId,
          foundationTypeId: tower.foundationTypeId,
          accessDifficulty: tower.accessDifficulty,
          notes: tower.notes,
        },
        include: {
          towerType: { select: { id: true, code: true } },
          soilType: { select: { id: true, code: true } },
          foundationType: { select: { id: true, code: true } },
        },
      });

      return PrismaStakingMappers.toStakingTowerEntity(
        updated as PrismaStakingTowerWithRelations,
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateTowerNumberException(tower.towerNumber);
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    await this.prisma.stakingTower.delete({
      where: { id },
    });
  }

  async batchUpdate(
    lineId: number,
    filter: StakingBatchFilter,
    updateData: StakingBatchUpdateData,
  ): Promise<number> {
    const where: Prisma.StakingTowerWhereInput = {
      transmissionLineId: lineId,
    };

    if (filter.towerIds && filter.towerIds.length > 0) {
      where.id = { in: filter.towerIds };
    }

    if (
      filter.startStationMeters !== undefined ||
      filter.endStationMeters !== undefined
    ) {
      where.stationMeters = {};
      if (filter.startStationMeters !== undefined) {
        where.stationMeters.gte = new Decimal(filter.startStationMeters);
      }
      if (filter.endStationMeters !== undefined) {
        where.stationMeters.lte = new Decimal(filter.endStationMeters);
      }
    }

    if (filter.towerTypeIdFilter !== undefined) {
      where.towerTypeId = filter.towerTypeIdFilter;
    }

    if (filter.soilTypeIdFilter !== undefined) {
      where.soilTypeId = filter.soilTypeIdFilter;
    }

    const data: Prisma.StakingTowerUncheckedUpdateManyInput = {};

    if (updateData.towerTypeId !== undefined) {
      data.towerTypeId = updateData.towerTypeId;
    }
    if (updateData.soilTypeId !== undefined) {
      data.soilTypeId = updateData.soilTypeId;
    }
    if (updateData.foundationTypeId !== undefined) {
      data.foundationTypeId = updateData.foundationTypeId;
    }
    if (updateData.accessDifficulty !== undefined) {
      data.accessDifficulty = updateData.accessDifficulty;
    }
    if (updateData.notes !== undefined) {
      data.notes = updateData.notes?.trim() || null;
    }

    const result = await this.prisma.stakingTower.updateMany({
      where,
      data,
    });

    return result.count;
  }

  async deleteManyByIds(ids: number[]): Promise<number> {
    const result = await this.prisma.stakingTower.deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  }
}
