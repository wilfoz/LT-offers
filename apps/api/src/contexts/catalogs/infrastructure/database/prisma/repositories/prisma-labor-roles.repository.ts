import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  LaborRoleEntity,
  LaborRoleVersionEntity,
  LaborRolesFilter,
  LaborRolesRepository,
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
export class PrismaLaborRolesRepository implements LaborRolesRepository {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<LaborRoleEntity | null> {
    const item = await this.prisma.laborRole.findUnique({
      where: { id },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toLaborRoleEntity(item) : null;
  }

  async findByCode(code: string): Promise<LaborRoleEntity | null> {
    const item = await this.prisma.laborRole.findUnique({
      where: { code },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toLaborRoleEntity(item) : null;
  }

  async list(filter?: LaborRolesFilter): Promise<LaborRoleEntity[]> {
    const where: Prisma.LaborRoleWhereInput = filter?.search
      ? {
          OR: [
            { code: { contains: filter.search, mode: 'insensitive' } },
            { name: { contains: filter.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const items = await this.prisma.laborRole.findMany({
      where,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map(PrismaCatalogMappers.toLaborRoleEntity);
  }

  async save(entity: LaborRoleEntity): Promise<LaborRoleEntity> {
    try {
      const initialVersion = entity.versions[0];
      const item = await this.prisma.laborRole.create({
        data: {
          code: entity.code,
          name: entity.name,
          versions: {
            create: {
              baseSalary: initialVersion.baseSalary
                ? new Prisma.Decimal(initialVersion.baseSalary)
                : null,
              hazardPayPercent: initialVersion.hazardPayPercent
                ? new Prisma.Decimal(initialVersion.hazardPayPercent)
                : null,
              overtimePercent: initialVersion.overtimePercent
                ? new Prisma.Decimal(initialVersion.overtimePercent)
                : null,
              dsrOvertimePercent: initialVersion.dsrOvertimePercent
                ? new Prisma.Decimal(initialVersion.dsrOvertimePercent)
                : null,
              socialChargesPercent: initialVersion.socialChargesPercent
                ? new Prisma.Decimal(initialVersion.socialChargesPercent)
                : null,
              foodAllowanceMonthly: initialVersion.foodAllowanceMonthly
                ? new Prisma.Decimal(initialVersion.foodAllowanceMonthly)
                : null,
              housingMonthly: initialVersion.housingMonthly
                ? new Prisma.Decimal(initialVersion.housingMonthly)
                : null,
              homeLeaveTravelMonthly: initialVersion.homeLeaveTravelMonthly
                ? new Prisma.Decimal(initialVersion.homeLeaveTravelMonthly)
                : null,
              healthInsuranceMonthly: initialVersion.healthInsuranceMonthly
                ? new Prisma.Decimal(initialVersion.healthInsuranceMonthly)
                : null,
              lifeInsuranceMonthly: initialVersion.lifeInsuranceMonthly
                ? new Prisma.Decimal(initialVersion.lifeInsuranceMonthly)
                : null,
              effectiveFrom:
                initialVersion.effectivePeriod.effectiveFrom.toDate(),
              createdBy: initialVersion.createdBy,
            },
          },
        },
        include: { versions: true },
      });
      return PrismaCatalogMappers.toLaborRoleEntity(item);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCatalogCodeException(entity.code);
      }
      throw error;
    }
  }

  async createVersion(
    laborRoleId: number,
    version: LaborRoleVersionEntity,
  ): Promise<LaborRoleVersionEntity> {
    try {
      const row = await this.prisma.laborRoleVersion.create({
        data: {
          laborRoleId,
          baseSalary: version.baseSalary
            ? new Prisma.Decimal(version.baseSalary)
            : null,
          hazardPayPercent: version.hazardPayPercent
            ? new Prisma.Decimal(version.hazardPayPercent)
            : null,
          overtimePercent: version.overtimePercent
            ? new Prisma.Decimal(version.overtimePercent)
            : null,
          dsrOvertimePercent: version.dsrOvertimePercent
            ? new Prisma.Decimal(version.dsrOvertimePercent)
            : null,
          socialChargesPercent: version.socialChargesPercent
            ? new Prisma.Decimal(version.socialChargesPercent)
            : null,
          foodAllowanceMonthly: version.foodAllowanceMonthly
            ? new Prisma.Decimal(version.foodAllowanceMonthly)
            : null,
          housingMonthly: version.housingMonthly
            ? new Prisma.Decimal(version.housingMonthly)
            : null,
          homeLeaveTravelMonthly: version.homeLeaveTravelMonthly
            ? new Prisma.Decimal(version.homeLeaveTravelMonthly)
            : null,
          healthInsuranceMonthly: version.healthInsuranceMonthly
            ? new Prisma.Decimal(version.healthInsuranceMonthly)
            : null,
          lifeInsuranceMonthly: version.lifeInsuranceMonthly
            ? new Prisma.Decimal(version.lifeInsuranceMonthly)
            : null,
          effectiveFrom: version.effectivePeriod.effectiveFrom.toDate(),
          createdBy: version.createdBy,
        },
      });

      return new LaborRoleVersionEntity({
        id: row.id,
        laborRoleId: row.laborRoleId,
        baseSalary: row.baseSalary?.toString() ?? null,
        hazardPayPercent: row.hazardPayPercent?.toString() ?? null,
        overtimePercent: row.overtimePercent?.toString() ?? null,
        dsrOvertimePercent: row.dsrOvertimePercent?.toString() ?? null,
        socialChargesPercent: row.socialChargesPercent?.toString() ?? null,
        foodAllowanceMonthly: row.foodAllowanceMonthly?.toString() ?? null,
        housingMonthly: row.housingMonthly?.toString() ?? null,
        homeLeaveTravelMonthly: row.homeLeaveTravelMonthly?.toString() ?? null,
        healthInsuranceMonthly: row.healthInsuranceMonthly?.toString() ?? null,
        lifeInsuranceMonthly: row.lifeInsuranceMonthly?.toString() ?? null,
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
