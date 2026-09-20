import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  FoundationVolumeEntity,
  FoundationVolumeVersionEntity,
  FoundationVolumesFilter,
  FoundationVolumesRepository,
  FOUNDATION_VOLUME_QUANTITY_FIELDS,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
} from '../../../../domain';
import { PrismaCatalogMappers } from '../prisma-catalogs.mapper';

const ITEM_INCLUDE = {
  versions: true,
  towerType: { include: { structureSeries: true } },
  soilType: true,
  foundationType: true,
} satisfies Prisma.FoundationVolumeInclude;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

@Injectable()
export class PrismaFoundationVolumesRepository implements FoundationVolumesRepository {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<FoundationVolumeEntity | null> {
    const item = await this.prisma.foundationVolume.findUnique({
      where: { id },
      include: ITEM_INCLUDE,
    });
    return item ? PrismaCatalogMappers.toFoundationVolumeEntity(item) : null;
  }

  async findByCombination(
    towerTypeId: number,
    soilTypeId: number,
    foundationTypeId: number,
  ): Promise<FoundationVolumeEntity | null> {
    const item = await this.prisma.foundationVolume.findUnique({
      where: {
        towerTypeId_soilTypeId_foundationTypeId: {
          towerTypeId,
          soilTypeId,
          foundationTypeId,
        },
      },
      include: ITEM_INCLUDE,
    });
    return item ? PrismaCatalogMappers.toFoundationVolumeEntity(item) : null;
  }

  async list(
    filter?: FoundationVolumesFilter,
  ): Promise<FoundationVolumeEntity[]> {
    const where: Prisma.FoundationVolumeWhereInput = {};
    if (filter?.towerTypeId) where.towerTypeId = filter.towerTypeId;
    if (filter?.soilTypeId) where.soilTypeId = filter.soilTypeId;
    if (filter?.foundationTypeId)
      where.foundationTypeId = filter.foundationTypeId;

    const items = await this.prisma.foundationVolume.findMany({
      where,
      include: ITEM_INCLUDE,
      orderBy: [
        { towerType: { structureSeries: { name: 'asc' } } },
        { towerType: { code: 'asc' } },
        { soilType: { code: 'asc' } },
        { foundationType: { code: 'asc' } },
      ],
    });

    return items.map(PrismaCatalogMappers.toFoundationVolumeEntity);
  }

  async save(entity: FoundationVolumeEntity): Promise<FoundationVolumeEntity> {
    try {
      const initialVersion = entity.versions[0];
      const quantitiesData: any = {};
      for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
        const val = (initialVersion as any)[field];
        quantitiesData[field] = val ? new Prisma.Decimal(val) : null;
      }

      const item = await this.prisma.foundationVolume.create({
        data: {
          towerTypeId: entity.towerTypeId,
          soilTypeId: entity.soilTypeId,
          foundationTypeId: entity.foundationTypeId,
          versions: {
            create: {
              ...quantitiesData,
              effectiveFrom:
                initialVersion.effectivePeriod.effectiveFrom.toDate(),
              createdBy: initialVersion.createdBy,
            },
          },
        },
        include: ITEM_INCLUDE,
      });
      return PrismaCatalogMappers.toFoundationVolumeEntity(item);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCatalogCodeException(
          `Já existe uma entrada para a combinação torre=${entity.towerTypeId}, solo=${entity.soilTypeId}, fundação=${entity.foundationTypeId}`,
        );
      }
      throw error;
    }
  }

  async createVersion(
    foundationVolumeId: number,
    version: FoundationVolumeVersionEntity,
  ): Promise<FoundationVolumeVersionEntity> {
    try {
      const quantitiesData: any = {};
      for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
        const val = (version as any)[field];
        quantitiesData[field] = val ? new Prisma.Decimal(val) : null;
      }

      const row = await this.prisma.foundationVolumeVersion.create({
        data: {
          foundationVolumeId,
          ...quantitiesData,
          effectiveFrom: version.effectivePeriod.effectiveFrom.toDate(),
          createdBy: version.createdBy,
        },
      });

      const resQuantities: any = {};
      for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
        resQuantities[field] = (row as any)[field]?.toString() ?? null;
      }

      return new FoundationVolumeVersionEntity({
        id: row.id,
        foundationVolumeId: row.foundationVolumeId,
        ...resQuantities,
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
