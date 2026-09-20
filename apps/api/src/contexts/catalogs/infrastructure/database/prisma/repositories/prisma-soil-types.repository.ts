import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  SoilTypeEntity,
  SoilTypeVersionEntity,
  SoilTypesFilter,
  SoilTypesRepository,
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
export class PrismaSoilTypesRepository implements SoilTypesRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<SoilTypeEntity | null> {
    const item = await this.prisma.soilType.findUnique({
      where: { id },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toSoilTypeEntity(item) : null;
  }

  async findByCode(code: string): Promise<SoilTypeEntity | null> {
    const item = await this.prisma.soilType.findUnique({
      where: { code },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toSoilTypeEntity(item) : null;
  }

  async list(filter?: SoilTypesFilter): Promise<SoilTypeEntity[]> {
    const where: Prisma.SoilTypeWhereInput = filter?.search
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

    const items = await this.prisma.soilType.findMany({
      where,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map(PrismaCatalogMappers.toSoilTypeEntity);
  }

  async save(entity: SoilTypeEntity): Promise<SoilTypeEntity> {
    try {
      const initialVersion = entity.versions[0];
      const item = await this.prisma.soilType.create({
        data: {
          code: entity.code,
          versions: {
            create: {
              description: initialVersion.description,
              submerged: initialVersion.submerged,
              allowableCompressionStressKgfCm2:
                initialVersion.allowableCompressionStressKgfCm2
                  ? new Prisma.Decimal(
                      initialVersion.allowableCompressionStressKgfCm2,
                    )
                  : null,
              specificWeightKgfM3: initialVersion.specificWeightKgfM3
                ? new Prisma.Decimal(initialVersion.specificWeightKgfM3)
                : null,
              internalFrictionAngleDeg: initialVersion.internalFrictionAngleDeg
                ? new Prisma.Decimal(initialVersion.internalFrictionAngleDeg)
                : null,
              cohesionKgCm2: initialVersion.cohesionKgCm2
                ? new Prisma.Decimal(initialVersion.cohesionKgCm2)
                : null,
              nsptMin: initialVersion.nsptMin,
              nsptMax: initialVersion.nsptMax,
              effectiveFrom:
                initialVersion.effectivePeriod.effectiveFrom.toDate(),
              createdBy: initialVersion.createdBy,
            },
          },
        },
        include: { versions: true },
      });
      return PrismaCatalogMappers.toSoilTypeEntity(item);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCatalogCodeException(entity.code);
      }
      throw error;
    }
  }

  async createVersion(
    soilTypeId: number,
    version: SoilTypeVersionEntity,
  ): Promise<SoilTypeVersionEntity> {
    try {
      const row = await this.prisma.soilTypeVersion.create({
        data: {
          soilTypeId,
          description: version.description,
          submerged: version.submerged,
          allowableCompressionStressKgfCm2:
            version.allowableCompressionStressKgfCm2
              ? new Prisma.Decimal(version.allowableCompressionStressKgfCm2)
              : null,
          specificWeightKgfM3: version.specificWeightKgfM3
            ? new Prisma.Decimal(version.specificWeightKgfM3)
            : null,
          internalFrictionAngleDeg: version.internalFrictionAngleDeg
            ? new Prisma.Decimal(version.internalFrictionAngleDeg)
            : null,
          cohesionKgCm2: version.cohesionKgCm2
            ? new Prisma.Decimal(version.cohesionKgCm2)
            : null,
          nsptMin: version.nsptMin,
          nsptMax: version.nsptMax,
          effectiveFrom: version.effectivePeriod.effectiveFrom.toDate(),
          createdBy: version.createdBy,
        },
      });

      return new SoilTypeVersionEntity({
        id: row.id,
        soilTypeId: row.soilTypeId,
        description: row.description,
        submerged: row.submerged,
        allowableCompressionStressKgfCm2:
          row.allowableCompressionStressKgfCm2?.toString() ?? null,
        specificWeightKgfM3: row.specificWeightKgfM3?.toString() ?? null,
        internalFrictionAngleDeg:
          row.internalFrictionAngleDeg?.toString() ?? null,
        cohesionKgCm2: row.cohesionKgCm2?.toString() ?? null,
        nsptMin: row.nsptMin,
        nsptMax: row.nsptMax,
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
