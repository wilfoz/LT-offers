import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  InsulatorEntity,
  InsulatorVersionEntity,
  InsulatorsFilter,
  InsulatorsRepository,
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
export class PrismaInsulatorsRepository implements InsulatorsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<InsulatorEntity | null> {
    const item = await this.prisma.insulator.findUnique({
      where: { id },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toInsulatorEntity(item) : null;
  }

  async findByCode(code: string): Promise<InsulatorEntity | null> {
    const item = await this.prisma.insulator.findUnique({
      where: { code },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toInsulatorEntity(item) : null;
  }

  async list(filter?: InsulatorsFilter): Promise<InsulatorEntity[]> {
    const where: Prisma.InsulatorWhereInput = filter?.search
      ? {
          OR: [
            { code: { contains: filter.search, mode: 'insensitive' } },
            {
              versions: {
                some: {
                  description: { contains: filter.search, mode: 'insensitive' },
                },
              },
            },
          ],
        }
      : {};

    const items = await this.prisma.insulator.findMany({
      where,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map(PrismaCatalogMappers.toInsulatorEntity);
  }

  async save(entity: InsulatorEntity): Promise<InsulatorEntity> {
    try {
      const initialVersion = entity.versions[0];
      const item = await this.prisma.insulator.create({
        data: {
          code: entity.code,
          versions: {
            create: {
              description: initialVersion.description,
              type: initialVersion.type,
              manufacturer: initialVersion.manufacturer,
              profile: initialVersion.profile,
              ruptureStrengthKn: initialVersion.ruptureStrengthKn
                ? new Prisma.Decimal(initialVersion.ruptureStrengthKn)
                : null,
              diameterMm: initialVersion.diameterMm
                ? new Prisma.Decimal(initialVersion.diameterMm)
                : null,
              spacingMm: initialVersion.spacingMm
                ? new Prisma.Decimal(initialVersion.spacingMm)
                : null,
              creepageDistanceMm: initialVersion.creepageDistanceMm
                ? new Prisma.Decimal(initialVersion.creepageDistanceMm)
                : null,
              effectiveFrom:
                initialVersion.effectivePeriod.effectiveFrom.toDate(),
              createdBy: initialVersion.createdBy,
            },
          },
        },
        include: { versions: true },
      });
      return PrismaCatalogMappers.toInsulatorEntity(item);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCatalogCodeException(entity.code);
      }
      throw error;
    }
  }

  async createVersion(
    insulatorId: number,
    version: InsulatorVersionEntity,
  ): Promise<InsulatorVersionEntity> {
    try {
      const row = await this.prisma.insulatorVersion.create({
        data: {
          insulatorId,
          description: version.description,
          type: version.type,
          manufacturer: version.manufacturer,
          profile: version.profile,
          ruptureStrengthKn: version.ruptureStrengthKn
            ? new Prisma.Decimal(version.ruptureStrengthKn)
            : null,
          diameterMm: version.diameterMm
            ? new Prisma.Decimal(version.diameterMm)
            : null,
          spacingMm: version.spacingMm
            ? new Prisma.Decimal(version.spacingMm)
            : null,
          creepageDistanceMm: version.creepageDistanceMm
            ? new Prisma.Decimal(version.creepageDistanceMm)
            : null,
          effectiveFrom: version.effectivePeriod.effectiveFrom.toDate(),
          createdBy: version.createdBy,
        },
      });

      return new InsulatorVersionEntity({
        id: row.id,
        insulatorId: row.insulatorId,
        description: row.description,
        type: row.type,
        manufacturer: row.manufacturer,
        profile: row.profile,
        ruptureStrengthKn: row.ruptureStrengthKn?.toString() ?? null,
        diameterMm: row.diameterMm?.toString() ?? null,
        spacingMm: row.spacingMm?.toString() ?? null,
        creepageDistanceMm: row.creepageDistanceMm?.toString() ?? null,
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
