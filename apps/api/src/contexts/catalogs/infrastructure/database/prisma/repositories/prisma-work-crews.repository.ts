import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  WorkCrewEntity,
  WorkCrewVersionEntity,
  WorkCrewsFilter,
  WorkCrewsRepository,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
} from '../../../../domain';
import { PrismaCatalogMappers } from '../prisma-catalogs.mapper';

const WORK_CREW_VERSION_INCLUDE = {
  laborRoles: {
    include: { laborRole: true },
    orderBy: { laborRoleId: 'asc' as const },
  },
  equipments: {
    include: { equipment: true },
    orderBy: { equipmentId: 'asc' as const },
  },
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
export class PrismaWorkCrewsRepository implements WorkCrewsRepository {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<WorkCrewEntity | null> {
    const item = await this.prisma.workCrew.findUnique({
      where: { id },
      include: {
        versions: {
          include: WORK_CREW_VERSION_INCLUDE,
        },
      },
    });
    return item ? PrismaCatalogMappers.toWorkCrewEntity(item) : null;
  }

  async findByCode(code: string): Promise<WorkCrewEntity | null> {
    const item = await this.prisma.workCrew.findUnique({
      where: { code },
      include: {
        versions: {
          include: WORK_CREW_VERSION_INCLUDE,
        },
      },
    });
    return item ? PrismaCatalogMappers.toWorkCrewEntity(item) : null;
  }

  async list(filter?: WorkCrewsFilter): Promise<WorkCrewEntity[]> {
    const where: Prisma.WorkCrewWhereInput = filter?.search
      ? {
          OR: [
            { code: { contains: filter.search, mode: 'insensitive' } },
            { name: { contains: filter.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const items = await this.prisma.workCrew.findMany({
      where,
      include: {
        versions: {
          include: WORK_CREW_VERSION_INCLUDE,
        },
      },
      orderBy: { code: 'asc' },
    });

    return items.map(PrismaCatalogMappers.toWorkCrewEntity);
  }

  async save(entity: WorkCrewEntity): Promise<WorkCrewEntity> {
    try {
      const initialVersion = entity.versions[0];
      const item = await this.prisma.workCrew.create({
        data: {
          code: entity.code,
          name: entity.name,
          versions: {
            create: {
              standardProductionRate: initialVersion.standardProductionRate
                ? new Prisma.Decimal(initialVersion.standardProductionRate)
                : null,
              productionUnit: initialVersion.productionUnit,
              productionPeriod: initialVersion.productionPeriod as any,
              effectiveFrom:
                initialVersion.effectivePeriod.effectiveFrom.toDate(),
              createdBy: initialVersion.createdBy,
              laborRoles: initialVersion.laborRoles.length
                ? {
                    create: initialVersion.laborRoles.map((lr) => ({
                      laborRoleId: lr.laborRoleId,
                      quantity: new Prisma.Decimal(lr.quantity),
                    })),
                  }
                : undefined,
              equipments: initialVersion.equipments.length
                ? {
                    create: initialVersion.equipments.map((eq) => ({
                      equipmentId: eq.equipmentId,
                      quantity: new Prisma.Decimal(eq.quantity),
                    })),
                  }
                : undefined,
            },
          },
        },
        include: {
          versions: {
            include: WORK_CREW_VERSION_INCLUDE,
          },
        },
      });
      return PrismaCatalogMappers.toWorkCrewEntity(item);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCatalogCodeException(entity.code);
      }
      throw error;
    }
  }

  async createVersion(
    workCrewId: number,
    version: WorkCrewVersionEntity,
  ): Promise<WorkCrewVersionEntity> {
    try {
      const row = await this.prisma.workCrewVersion.create({
        data: {
          workCrewId,
          standardProductionRate: version.standardProductionRate
            ? new Prisma.Decimal(version.standardProductionRate)
            : null,
          productionUnit: version.productionUnit,
          productionPeriod: version.productionPeriod as any,
          effectiveFrom: version.effectivePeriod.effectiveFrom.toDate(),
          createdBy: version.createdBy,
          laborRoles: version.laborRoles.length
            ? {
                create: version.laborRoles.map((lr) => ({
                  laborRoleId: lr.laborRoleId,
                  quantity: new Prisma.Decimal(lr.quantity),
                })),
              }
            : undefined,
          equipments: version.equipments.length
            ? {
                create: version.equipments.map((eq) => ({
                  equipmentId: eq.equipmentId,
                  quantity: new Prisma.Decimal(eq.quantity),
                })),
              }
            : undefined,
        },
        include: WORK_CREW_VERSION_INCLUDE,
      });

      return new WorkCrewVersionEntity({
        id: row.id,
        workCrewId: row.workCrewId,
        standardProductionRate: row.standardProductionRate?.toString() ?? null,
        productionUnit: row.productionUnit,
        productionPeriod: row.productionPeriod as any,
        laborRoles: row.laborRoles.map((lr) => ({
          laborRoleId: lr.laborRoleId,
          laborRoleCode: lr.laborRole?.code,
          laborRoleName: lr.laborRole?.name,
          quantity: lr.quantity.toString(),
        })),
        equipments: row.equipments.map((eq) => ({
          equipmentId: eq.equipmentId,
          equipmentCode: eq.equipment?.code,
          equipmentDescription: eq.equipment?.description,
          quantity: eq.quantity.toString(),
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
