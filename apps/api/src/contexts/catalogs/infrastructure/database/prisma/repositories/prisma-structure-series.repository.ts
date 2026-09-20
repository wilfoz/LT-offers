import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  StructureSeriesEntity,
  StructureSeriesVersionEntity,
  StructureSeriesFilter,
  StructureSeriesRepository,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
} from '../../../../domain';
import { PrismaCatalogMappers } from '../prisma-catalogs.mapper';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

@Injectable()
export class PrismaStructureSeriesRepository implements StructureSeriesRepository {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<StructureSeriesEntity | null> {
    const item = await this.prisma.structureSeries.findUnique({
      where: { id },
      include: { versions: true, _count: { select: { towerTypes: true } } },
    });
    return item ? PrismaCatalogMappers.toStructureSeriesEntity(item) : null;
  }

  async findByName(name: string): Promise<StructureSeriesEntity | null> {
    const item = await this.prisma.structureSeries.findUnique({
      where: { name },
      include: { versions: true, _count: { select: { towerTypes: true } } },
    });
    return item ? PrismaCatalogMappers.toStructureSeriesEntity(item) : null;
  }

  async list(filter?: StructureSeriesFilter): Promise<StructureSeriesEntity[]> {
    const where: Prisma.StructureSeriesWhereInput = filter?.search
      ? {
          OR: [
            { name: { contains: filter.search, mode: 'insensitive' } },
            {
              versions: {
                some: {
                  designer: { contains: filter.search, mode: 'insensitive' },
                },
              },
            },
          ],
        }
      : {};

    const items = await this.prisma.structureSeries.findMany({
      where,
      include: { versions: true, _count: { select: { towerTypes: true } } },
      orderBy: { name: 'asc' },
    });

    return items.map(PrismaCatalogMappers.toStructureSeriesEntity);
  }

  async save(entity: StructureSeriesEntity): Promise<StructureSeriesEntity> {
    try {
      const initialVersion = entity.versions[0];
      const item = await this.prisma.structureSeries.create({
        data: {
          name: entity.name,
          versions: {
            create: {
              designer: initialVersion.designer,
              voltageKv: initialVersion.voltageKv
                ? new Prisma.Decimal(initialVersion.voltageKv)
                : null,
              circuitCount: initialVersion.circuitCount,
              cablesPerPhase: initialVersion.cablesPerPhase,
              designWindSpeedMs: initialVersion.designWindSpeedMs
                ? new Prisma.Decimal(initialVersion.designWindSpeedMs)
                : null,
              insulatorType: initialVersion.insulatorType,
              silMw: initialVersion.silMw
                ? new Prisma.Decimal(initialVersion.silMw)
                : null,
              effectiveFrom:
                initialVersion.effectivePeriod.effectiveFrom.toDate(),
              createdBy: initialVersion.createdBy,
            },
          },
        },
        include: { versions: true, _count: { select: { towerTypes: true } } },
      });
      return PrismaCatalogMappers.toStructureSeriesEntity(item);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCatalogCodeException(entity.name);
      }
      throw error;
    }
  }

  async createVersion(
    structureSeriesId: number,
    version: StructureSeriesVersionEntity,
  ): Promise<StructureSeriesVersionEntity> {
    try {
      const row = await this.prisma.structureSeriesVersion.create({
        data: {
          structureSeriesId,
          designer: version.designer,
          voltageKv: version.voltageKv
            ? new Prisma.Decimal(version.voltageKv)
            : null,
          circuitCount: version.circuitCount,
          cablesPerPhase: version.cablesPerPhase,
          designWindSpeedMs: version.designWindSpeedMs
            ? new Prisma.Decimal(version.designWindSpeedMs)
            : null,
          insulatorType: version.insulatorType,
          silMw: version.silMw ? new Prisma.Decimal(version.silMw) : null,
          effectiveFrom: version.effectivePeriod.effectiveFrom.toDate(),
          createdBy: version.createdBy,
        },
      });

      return new StructureSeriesVersionEntity({
        id: row.id,
        structureSeriesId: row.structureSeriesId,
        designer: row.designer,
        voltageKv: row.voltageKv?.toString() ?? null,
        circuitCount: row.circuitCount,
        cablesPerPhase: row.cablesPerPhase,
        designWindSpeedMs: row.designWindSpeedMs?.toString() ?? null,
        insulatorType: row.insulatorType,
        silMw: row.silMw?.toString() ?? null,
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
