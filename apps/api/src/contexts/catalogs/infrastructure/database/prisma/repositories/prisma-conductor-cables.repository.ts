import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  ConductorCableEntity,
  ConductorCableVersionEntity,
  ConductorCablesFilter,
  ConductorCablesRepository,
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
export class PrismaConductorCablesRepository implements ConductorCablesRepository {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<ConductorCableEntity | null> {
    const item = await this.prisma.conductorCable.findUnique({
      where: { id },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toConductorCableEntity(item) : null;
  }

  async findByCode(code: string): Promise<ConductorCableEntity | null> {
    const item = await this.prisma.conductorCable.findUnique({
      where: { code },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toConductorCableEntity(item) : null;
  }

  async list(filter?: ConductorCablesFilter): Promise<ConductorCableEntity[]> {
    const where: Prisma.ConductorCableWhereInput = filter?.search
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

    const items = await this.prisma.conductorCable.findMany({
      where,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map(PrismaCatalogMappers.toConductorCableEntity);
  }

  async save(entity: ConductorCableEntity): Promise<ConductorCableEntity> {
    try {
      const initialVersion = entity.versions[0];
      const item = await this.prisma.conductorCable.create({
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
              effectiveFrom:
                initialVersion.effectivePeriod.effectiveFrom.toDate(),
              createdBy: initialVersion.createdBy,
            },
          },
        },
        include: { versions: true },
      });
      return PrismaCatalogMappers.toConductorCableEntity(item);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCatalogCodeException(entity.code);
      }
      throw error;
    }
  }

  async createVersion(
    conductorCableId: number,
    version: ConductorCableVersionEntity,
  ): Promise<ConductorCableVersionEntity> {
    try {
      const row = await this.prisma.conductorCableVersion.create({
        data: {
          conductorCableId,
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
          effectiveFrom: version.effectivePeriod.effectiveFrom.toDate(),
          createdBy: version.createdBy,
        },
      });

      return new ConductorCableVersionEntity({
        id: row.id,
        conductorCableId: row.conductorCableId,
        description: row.description,
        weightTonPerKm: row.weightTonPerKm?.toString() ?? null,
        reelLengthM: row.reelLengthM?.toString() ?? null,
        diameterMm: row.diameterMm?.toString() ?? null,
        utsKn: row.utsKn?.toString() ?? null,
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
