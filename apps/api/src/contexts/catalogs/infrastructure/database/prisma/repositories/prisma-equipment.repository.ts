import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  EquipmentEntity,
  EquipmentVersionEntity,
  EquipmentFilter,
  EquipmentRepository,
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
export class PrismaEquipmentRepository implements EquipmentRepository {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<EquipmentEntity | null> {
    const item = await this.prisma.equipment.findUnique({
      where: { id },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toEquipmentEntity(item) : null;
  }

  async findByCode(code: string): Promise<EquipmentEntity | null> {
    const item = await this.prisma.equipment.findUnique({
      where: { code },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toEquipmentEntity(item) : null;
  }

  async list(filter?: EquipmentFilter): Promise<EquipmentEntity[]> {
    const where: Prisma.EquipmentWhereInput = filter?.search
      ? {
          OR: [
            { code: { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const items = await this.prisma.equipment.findMany({
      where,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map(PrismaCatalogMappers.toEquipmentEntity);
  }

  async save(entity: EquipmentEntity): Promise<EquipmentEntity> {
    try {
      const initialVersion = entity.versions[0];
      const item = await this.prisma.equipment.create({
        data: {
          code: entity.code,
          description: entity.description,
          category: entity.category,
          versions: {
            create: {
              externalRentalMonthly: initialVersion.externalRentalMonthly
                ? new Prisma.Decimal(initialVersion.externalRentalMonthly)
                : null,
              internalRentalMonthly: initialVersion.internalRentalMonthly
                ? new Prisma.Decimal(initialVersion.internalRentalMonthly)
                : null,
              purchasePrice: initialVersion.purchasePrice
                ? new Prisma.Decimal(initialVersion.purchasePrice)
                : null,
              depreciationYears: initialVersion.depreciationYears,
              ownedAvailabilityCount: initialVersion.ownedAvailabilityCount,
              fuelMaintenanceMonthly: initialVersion.fuelMaintenanceMonthly
                ? new Prisma.Decimal(initialVersion.fuelMaintenanceMonthly)
                : null,
              effectiveFrom:
                initialVersion.effectivePeriod.effectiveFrom.toDate(),
              createdBy: initialVersion.createdBy,
            },
          },
        },
        include: { versions: true },
      });
      return PrismaCatalogMappers.toEquipmentEntity(item);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCatalogCodeException(entity.code);
      }
      throw error;
    }
  }

  async createVersion(
    equipmentId: number,
    version: EquipmentVersionEntity,
  ): Promise<EquipmentVersionEntity> {
    try {
      const row = await this.prisma.equipmentVersion.create({
        data: {
          equipmentId,
          externalRentalMonthly: version.externalRentalMonthly
            ? new Prisma.Decimal(version.externalRentalMonthly)
            : null,
          internalRentalMonthly: version.internalRentalMonthly
            ? new Prisma.Decimal(version.internalRentalMonthly)
            : null,
          purchasePrice: version.purchasePrice
            ? new Prisma.Decimal(version.purchasePrice)
            : null,
          depreciationYears: version.depreciationYears,
          ownedAvailabilityCount: version.ownedAvailabilityCount,
          fuelMaintenanceMonthly: version.fuelMaintenanceMonthly
            ? new Prisma.Decimal(version.fuelMaintenanceMonthly)
            : null,
          effectiveFrom: version.effectivePeriod.effectiveFrom.toDate(),
          createdBy: version.createdBy,
        },
      });

      return new EquipmentVersionEntity({
        id: row.id,
        equipmentId: row.equipmentId,
        externalRentalMonthly: row.externalRentalMonthly?.toString() ?? null,
        internalRentalMonthly: row.internalRentalMonthly?.toString() ?? null,
        purchasePrice: row.purchasePrice?.toString() ?? null,
        depreciationYears: row.depreciationYears,
        ownedAvailabilityCount: row.ownedAvailabilityCount,
        fuelMaintenanceMonthly: row.fuelMaintenanceMonthly?.toString() ?? null,
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
