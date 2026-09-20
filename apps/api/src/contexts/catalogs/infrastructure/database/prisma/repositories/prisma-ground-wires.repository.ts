import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  GroundWireEntity,
  GroundWireVersionEntity,
  GroundWiresFilter,
  GroundWiresRepository,
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
export class PrismaGroundWiresRepository implements GroundWiresRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<GroundWireEntity | null> {
    const item = await this.prisma.groundWire.findUnique({
      where: { id },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toGroundWireEntity(item) : null;
  }

  async findByCode(code: string): Promise<GroundWireEntity | null> {
    const item = await this.prisma.groundWire.findUnique({
      where: { code },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toGroundWireEntity(item) : null;
  }

  async list(filter?: GroundWiresFilter): Promise<GroundWireEntity[]> {
    const where: Prisma.GroundWireWhereInput = filter?.search
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

    const items = await this.prisma.groundWire.findMany({
      where,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map(PrismaCatalogMappers.toGroundWireEntity);
  }

  async save(entity: GroundWireEntity): Promise<GroundWireEntity> {
    try {
      const initialVersion = entity.versions[0];
      const item = await this.prisma.groundWire.create({
        data: {
          code: entity.code,
          type: entity.type as any,
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
              manufacturer: initialVersion.manufacturer,
              i2tKa2s: initialVersion.i2tKa2s
                ? new Prisma.Decimal(initialVersion.i2tKa2s)
                : null,
              fiberCount: initialVersion.fiberCount,
              effectiveFrom:
                initialVersion.effectivePeriod.effectiveFrom.toDate(),
              createdBy: initialVersion.createdBy,
            },
          },
        },
        include: { versions: true },
      });
      return PrismaCatalogMappers.toGroundWireEntity(item);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCatalogCodeException(entity.code);
      }
      throw error;
    }
  }

  async createVersion(
    groundWireId: number,
    version: GroundWireVersionEntity,
  ): Promise<GroundWireVersionEntity> {
    try {
      const row = await this.prisma.groundWireVersion.create({
        data: {
          groundWireId,
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
          manufacturer: version.manufacturer,
          i2tKa2s: version.i2tKa2s ? new Prisma.Decimal(version.i2tKa2s) : null,
          fiberCount: version.fiberCount,
          effectiveFrom: version.effectivePeriod.effectiveFrom.toDate(),
          createdBy: version.createdBy,
        },
      });

      return new GroundWireVersionEntity({
        id: row.id,
        groundWireId: row.groundWireId,
        description: row.description,
        weightTonPerKm: row.weightTonPerKm?.toString() ?? null,
        reelLengthM: row.reelLengthM?.toString() ?? null,
        diameterMm: row.diameterMm?.toString() ?? null,
        utsKn: row.utsKn?.toString() ?? null,
        galvanizationClass: row.galvanizationClass,
        strengthGrade: row.strengthGrade,
        wireCount: row.wireCount,
        manufacturer: row.manufacturer,
        i2tKa2s: row.i2tKa2s?.toString() ?? null,
        fiberCount: row.fiberCount,
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
