import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../../app/prisma.service';
import {
  FoundationTypeEntity,
  FoundationTypeVersionEntity,
  FoundationTypesFilter,
  FoundationTypesRepository,
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
export class PrismaFoundationTypesRepository implements FoundationTypesRepository {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async findById(id: number): Promise<FoundationTypeEntity | null> {
    const item = await this.prisma.foundationType.findUnique({
      where: { id },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toFoundationTypeEntity(item) : null;
  }

  async findByCode(code: string): Promise<FoundationTypeEntity | null> {
    const item = await this.prisma.foundationType.findUnique({
      where: { code },
      include: { versions: true },
    });
    return item ? PrismaCatalogMappers.toFoundationTypeEntity(item) : null;
  }

  async list(filter?: FoundationTypesFilter): Promise<FoundationTypeEntity[]> {
    const where: Prisma.FoundationTypeWhereInput = filter?.search
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

    const items = await this.prisma.foundationType.findMany({
      where,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map(PrismaCatalogMappers.toFoundationTypeEntity);
  }

  async save(entity: FoundationTypeEntity): Promise<FoundationTypeEntity> {
    try {
      const initialVersion = entity.versions[0];
      const item = await this.prisma.foundationType.create({
        data: {
          code: entity.code,
          application: entity.application as any,
          versions: {
            create: {
              description: initialVersion.description,
              spreadFootingCount: initialVersion.spreadFootingCount,
              precastMastCount: initialVersion.precastMastCount,
              precastGuyCount: initialVersion.precastGuyCount,
              straightPierCount: initialVersion.straightPierCount,
              belledPierCount: initialVersion.belledPierCount,
              slabPierCount: initialVersion.slabPierCount,
              straightPierGuyCount: initialVersion.straightPierGuyCount,
              belledPierGuyCount: initialVersion.belledPierGuyCount,
              rockAnchorCount: initialVersion.rockAnchorCount,
              concretePileCount: initialVersion.concretePileCount,
              steelPileCount: initialVersion.steelPileCount,
              helicalMastCount: initialVersion.helicalMastCount,
              helicalGuyCount: initialVersion.helicalGuyCount,
              triconeCount: initialVersion.triconeCount,
              rootPileCount: initialVersion.rootPileCount,
              micropileCount: initialVersion.micropileCount,
              continuousAugerPileCount: initialVersion.continuousAugerPileCount,
              effectiveFrom:
                initialVersion.effectivePeriod.effectiveFrom.toDate(),
              createdBy: initialVersion.createdBy,
            },
          },
        },
        include: { versions: true },
      });
      return PrismaCatalogMappers.toFoundationTypeEntity(item);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCatalogCodeException(entity.code);
      }
      throw error;
    }
  }

  async createVersion(
    foundationTypeId: number,
    version: FoundationTypeVersionEntity,
  ): Promise<FoundationTypeVersionEntity> {
    try {
      const row = await this.prisma.foundationTypeVersion.create({
        data: {
          foundationTypeId,
          description: version.description,
          spreadFootingCount: version.spreadFootingCount,
          precastMastCount: version.precastMastCount,
          precastGuyCount: version.precastGuyCount,
          straightPierCount: version.straightPierCount,
          belledPierCount: version.belledPierCount,
          slabPierCount: version.slabPierCount,
          straightPierGuyCount: version.straightPierGuyCount,
          belledPierGuyCount: version.belledPierGuyCount,
          rockAnchorCount: version.rockAnchorCount,
          concretePileCount: version.concretePileCount,
          steelPileCount: version.steelPileCount,
          helicalMastCount: version.helicalMastCount,
          helicalGuyCount: version.helicalGuyCount,
          triconeCount: version.triconeCount,
          rootPileCount: version.rootPileCount,
          micropileCount: version.micropileCount,
          continuousAugerPileCount: version.continuousAugerPileCount,
          effectiveFrom: version.effectivePeriod.effectiveFrom.toDate(),
          createdBy: version.createdBy,
        },
      });

      return new FoundationTypeVersionEntity({
        id: row.id,
        foundationTypeId: row.foundationTypeId,
        description: row.description,
        spreadFootingCount: row.spreadFootingCount,
        precastMastCount: row.precastMastCount,
        precastGuyCount: row.precastGuyCount,
        straightPierCount: row.straightPierCount,
        belledPierCount: row.belledPierCount,
        slabPierCount: row.slabPierCount,
        straightPierGuyCount: row.straightPierGuyCount,
        belledPierGuyCount: row.belledPierGuyCount,
        rockAnchorCount: row.rockAnchorCount,
        concretePileCount: row.concretePileCount,
        steelPileCount: row.steelPileCount,
        helicalMastCount: row.helicalMastCount,
        helicalGuyCount: row.helicalGuyCount,
        triconeCount: row.triconeCount,
        rootPileCount: row.rootPileCount,
        micropileCount: row.micropileCount,
        continuousAugerPileCount: row.continuousAugerPileCount,
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
