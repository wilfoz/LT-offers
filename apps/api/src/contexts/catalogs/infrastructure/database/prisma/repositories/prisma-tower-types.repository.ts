import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  TowerTypeEntity,
  TowerTypeVersionEntity,
  TowerTypesRepository,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
} from '../../../../domain';
import { PrismaCatalogMappers } from '../prisma-catalogs.mapper';

const WEIGHTS_INCLUDE = {
  weights: { orderBy: { heightM: 'asc' as const } },
};

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

@Injectable()
export class PrismaTowerTypesRepository implements TowerTypesRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<TowerTypeEntity | null> {
    const item = await this.prisma.towerType.findUnique({
      where: { id },
      include: {
        versions: {
          include: WEIGHTS_INCLUDE,
        },
      },
    });
    return item ? PrismaCatalogMappers.toTowerTypeEntity(item) : null;
  }

  async findBySeriesAndCode(
    structureSeriesId: number,
    code: string,
  ): Promise<TowerTypeEntity | null> {
    const item = await this.prisma.towerType.findUnique({
      where: {
        structureSeriesId_code: { structureSeriesId, code },
      },
      include: {
        versions: {
          include: WEIGHTS_INCLUDE,
        },
      },
    });
    return item ? PrismaCatalogMappers.toTowerTypeEntity(item) : null;
  }

  async listBySeries(structureSeriesId: number): Promise<TowerTypeEntity[]> {
    const items = await this.prisma.towerType.findMany({
      where: { structureSeriesId },
      include: {
        versions: {
          include: WEIGHTS_INCLUDE,
        },
      },
      orderBy: { code: 'asc' },
    });

    return items.map(PrismaCatalogMappers.toTowerTypeEntity);
  }

  async save(entity: TowerTypeEntity): Promise<TowerTypeEntity> {
    try {
      const initialVersion = entity.versions[0];
      const item = await this.prisma.towerType.create({
        data: {
          structureSeriesId: entity.structureSeriesId,
          code: entity.code,
          function: entity.function as any,
          versions: {
            create: {
              guyCount: initialVersion.guyCount,
              effectiveFrom:
                initialVersion.effectivePeriod.effectiveFrom.toDate(),
              createdBy: initialVersion.createdBy,
              weights: initialVersion.weights.length
                ? {
                    create: initialVersion.weights.map((point) => ({
                      heightM: new Prisma.Decimal(point.heightM),
                      weightKg: new Prisma.Decimal(point.weightKg),
                    })),
                  }
                : undefined,
            },
          },
        },
        include: {
          versions: {
            include: WEIGHTS_INCLUDE,
          },
        },
      });
      return PrismaCatalogMappers.toTowerTypeEntity(item);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCatalogCodeException(entity.code);
      }
      throw error;
    }
  }

  async createVersion(
    towerTypeId: number,
    version: TowerTypeVersionEntity,
  ): Promise<TowerTypeVersionEntity> {
    try {
      const row = await this.prisma.towerTypeVersion.create({
        data: {
          towerTypeId,
          guyCount: version.guyCount,
          effectiveFrom: version.effectivePeriod.effectiveFrom.toDate(),
          createdBy: version.createdBy,
          weights: version.weights.length
            ? {
                create: version.weights.map((point) => ({
                  heightM: new Prisma.Decimal(point.heightM),
                  weightKg: new Prisma.Decimal(point.weightKg),
                })),
              }
            : undefined,
        },
        include: WEIGHTS_INCLUDE,
      });

      return new TowerTypeVersionEntity({
        id: row.id,
        towerTypeId: row.towerTypeId,
        guyCount: row.guyCount,
        weights: row.weights.map((w) => ({
          heightM: w.heightM.toString(),
          weightKg: w.weightKg.toString(),
        })),
        effectivePeriod: version.effectivePeriod,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateVersionDateException();
      }
      throw error;
    }
  }
}
