import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  GuyWireEntity,
  GuyWireVersionEntity,
  GuyWiresFilter,
  GuyWiresRepository,
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
export class PrismaGuyWiresRepository implements GuyWiresRepository {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<GuyWireEntity | null> {
    const item = await this.prisma.guyWire.findUnique({
      where: { id },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toGuyWireEntity(item) : null;
  }

  async findByCode(code: string): Promise<GuyWireEntity | null> {
    const item = await this.prisma.guyWire.findUnique({
      where: { code },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toGuyWireEntity(item) : null;
  }

  async list(filter?: GuyWiresFilter): Promise<GuyWireEntity[]> {
    const where: Prisma.GuyWireWhereInput = filter?.search
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

    const items = await this.prisma.guyWire.findMany({
      where,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map(PrismaCatalogMappers.toGuyWireEntity);
  }

  async save(entity: GuyWireEntity): Promise<GuyWireEntity> {
    try {
      const initialVersion = entity.versions[0];
      const item = await this.prisma.guyWire.create({
        data: {
          code: entity.code,
          versions: {
            create: {
              description: initialVersion.description,
              weightTonPerKm: initialVersion.weightTonPerKm
                ? new Prisma.Decimal(initialVersion.weightTonPerKm)
                : null,
              reelLengthM: initialVersion.reelLengthM
                ? new Prisma.Decimal(initialVersion.reelLengthM)
                : null,
              diameterMm: initialVersion.diameterMm
                ? new Prisma.Decimal(initialVersion.diameterMm)
                : null,
              utsKn: initialVersion.utsKn
                ? new Prisma.Decimal(initialVersion.utsKn)
                : null,
              galvanizationClass: initialVersion.galvanizationClass,
              strengthGrade: initialVersion.strengthGrade,
              wireCount: initialVersion.wireCount,
              effectiveFrom:
                initialVersion.effectivePeriod.effectiveFrom.toDate(),
              createdBy: initialVersion.createdBy,
            },
          },
        },
        include: { versions: true },
      });
      return PrismaCatalogMappers.toGuyWireEntity(item);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCatalogCodeException(entity.code);
      }
      throw error;
    }
  }

  async createVersion(
    guyWireId: number,
    version: GuyWireVersionEntity,
  ): Promise<GuyWireVersionEntity> {
    try {
      const row = await this.prisma.guyWireVersion.create({
        data: {
          guyWireId,
          description: version.description,
          weightTonPerKm: version.weightTonPerKm
            ? new Prisma.Decimal(version.weightTonPerKm)
            : null,
          reelLengthM: version.reelLengthM
            ? new Prisma.Decimal(version.reelLengthM)
            : null,
          diameterMm: version.diameterMm
            ? new Prisma.Decimal(version.diameterMm)
            : null,
          utsKn: version.utsKn ? new Prisma.Decimal(version.utsKn) : null,
          galvanizationClass: version.galvanizationClass,
          strengthGrade: version.strengthGrade,
          wireCount: version.wireCount,
          effectiveFrom: version.effectivePeriod.effectiveFrom.toDate(),
          createdBy: version.createdBy,
        },
      });

      return new GuyWireVersionEntity({
        id: row.id,
        guyWireId: row.guyWireId,
        description: row.description,
        weightTonPerKm: row.weightTonPerKm?.toString() ?? null,
        reelLengthM: row.reelLengthM?.toString() ?? null,
        diameterMm: row.diameterMm?.toString() ?? null,
        utsKn: row.utsKn?.toString() ?? null,
        galvanizationClass: row.galvanizationClass,
        strengthGrade: row.strengthGrade,
        wireCount: row.wireCount,
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
