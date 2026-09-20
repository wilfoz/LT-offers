import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  FixedCostEntity,
  FixedCostVersionEntity,
  FixedCostsFilter,
  FixedCostsRepository,
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
export class PrismaFixedCostsRepository implements FixedCostsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<FixedCostEntity | null> {
    const item = await this.prisma.fixedCost.findUnique({
      where: { id },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toFixedCostEntity(item) : null;
  }

  async findByCode(code: string): Promise<FixedCostEntity | null> {
    const item = await this.prisma.fixedCost.findUnique({
      where: { code },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toFixedCostEntity(item) : null;
  }

  async list(filter?: FixedCostsFilter): Promise<FixedCostEntity[]> {
    const where: Prisma.FixedCostWhereInput = filter?.search
      ? {
          OR: [
            { code: { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const items = await this.prisma.fixedCost.findMany({
      where,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map(PrismaCatalogMappers.toFixedCostEntity);
  }

  async save(entity: FixedCostEntity): Promise<FixedCostEntity> {
    try {
      const initialVersion = entity.versions[0];
      const item = await this.prisma.fixedCost.create({
        data: {
          code: entity.code,
          description: entity.description,
          category: entity.category as any,
          versions: {
            create: {
              unitCost: initialVersion.unitCost
                ? new Prisma.Decimal(initialVersion.unitCost)
                : null,
              unit: initialVersion.unit,
              effectiveFrom:
                initialVersion.effectivePeriod.effectiveFrom.toDate(),
              createdBy: initialVersion.createdBy,
            },
          },
        },
        include: { versions: true },
      });
      return PrismaCatalogMappers.toFixedCostEntity(item);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCatalogCodeException(entity.code);
      }
      throw error;
    }
  }

  async createVersion(
    fixedCostId: number,
    version: FixedCostVersionEntity,
  ): Promise<FixedCostVersionEntity> {
    try {
      const row = await this.prisma.fixedCostVersion.create({
        data: {
          fixedCostId,
          unitCost: version.unitCost
            ? new Prisma.Decimal(version.unitCost)
            : null,
          unit: version.unit,
          effectiveFrom: version.effectivePeriod.effectiveFrom.toDate(),
          createdBy: version.createdBy,
        },
      });

      return new FixedCostVersionEntity({
        id: row.id,
        fixedCostId: row.fixedCostId,
        unitCost: row.unitCost?.toString() ?? null,
        unit: row.unit,
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
