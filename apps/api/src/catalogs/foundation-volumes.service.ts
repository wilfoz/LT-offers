import {
  FOUNDATION_VOLUME_QUANTITY_FIELDS,
  FoundationVolumeCombination,
  FoundationVolumeHistory,
  FoundationVolumeQuantities,
  FoundationVolumeSummary,
  FoundationVolumeVersion,
} from '@lt-offers/domain';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { FoundationVolumeVersion as FoundationVolumeVersionRow } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from './civil-date';
import { CreateFoundationVolumeDto } from './dto/create-foundation-volume.dto';
import { CreateFoundationVolumeVersionDto } from './dto/create-foundation-volume-version.dto';
import { FoundationVolumeQuantitiesDto } from './dto/foundation-volume-quantities.dto';
import { isMissing, resolveEffectiveVersion } from './effectiveness';
import { isUniqueViolation } from './prisma-errors';

// Rótulo único de pendência (RF-11): a matriz é pendente quando a versão não
// tem NENHUMA quantidade informada — não há sinalização por coluna, pois a
// aplicabilidade depende da composição da fundação e a planilha não tem essa
// regra (premissa 6 do proposal; limite missingFields-sem-derivados, D3).
const QUANTITIES_PENDING_LABEL = 'quantidades';

// Rótulos da combinação carregados junto (a listagem é ilegível só com ids)
const ITEM_INCLUDE = {
  versions: true,
  towerType: { include: { structureSeries: true } },
  soilType: true,
  foundationType: true,
} satisfies Prisma.FoundationVolumeInclude;

type ItemWithRefs = Prisma.FoundationVolumeGetPayload<{
  include: typeof ITEM_INCLUDE;
}>;

export interface FoundationVolumeListFilters {
  towerTypeId?: number;
  soilTypeId?: number;
  foundationTypeId?: number;
}

@Injectable()
export class FoundationVolumesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateFoundationVolumeDto,
    createdBy: string,
    today: Date,
  ): Promise<FoundationVolumeSummary> {
    await this.assertReferencesExist(dto);
    const effectiveFrom = dto.effectiveFrom
      ? toCivilDate(dto.effectiveFrom)
      : today;

    try {
      const item = await this.prisma.foundationVolume.create({
        data: {
          towerTypeId: dto.towerTypeId,
          soilTypeId: dto.soilTypeId,
          foundationTypeId: dto.foundationTypeId,
          versions: {
            create: {
              ...this.toVersionFields(dto),
              effectiveFrom,
              createdBy,
            },
          },
        },
        include: ITEM_INCLUDE,
      });
      return this.toSummary(item, item.versions[0]);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'Já existe uma entrada da matriz para esta combinação de tipo de torre, solo e fundação',
        );
      }
      throw error;
    }
  }

  async createVersion(
    id: number,
    dto: CreateFoundationVolumeVersionDto,
    createdBy: string,
  ): Promise<FoundationVolumeVersion> {
    await this.getItem(id);
    const effectiveFrom = toCivilDate(dto.effectiveFrom);

    try {
      const version = await this.prisma.foundationVolumeVersion.create({
        data: {
          foundationVolumeId: id,
          ...this.toVersionFields(dto),
          effectiveFrom,
          createdBy,
        },
      });
      return this.toVersionContract(version);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'Já existe uma versão com esta data de início de vigência; escolha outra data',
        );
      }
      throw error;
    }
  }

  async list(
    filters: FoundationVolumeListFilters,
    referenceDate: Date,
  ): Promise<FoundationVolumeSummary[]> {
    const items = await this.prisma.foundationVolume.findMany({
      where: {
        ...(filters.towerTypeId ? { towerTypeId: filters.towerTypeId } : {}),
        ...(filters.soilTypeId ? { soilTypeId: filters.soilTypeId } : {}),
        ...(filters.foundationTypeId
          ? { foundationTypeId: filters.foundationTypeId }
          : {}),
      },
      include: ITEM_INCLUDE,
      orderBy: { id: 'asc' },
    });

    return items.map((item) => {
      const effective = resolveEffectiveVersion(item.versions, referenceDate);
      return this.toSummary(item, effective);
    });
  }

  async get(id: number, referenceDate: Date): Promise<FoundationVolumeSummary> {
    const item = await this.getItem(id);
    const effective = resolveEffectiveVersion(item.versions, referenceDate);
    if (!effective) {
      throw new NotFoundException(
        'Não há versão vigente para a data de referência informada',
      );
    }
    return this.toSummary(item, effective);
  }

  async listHistory(id: number): Promise<FoundationVolumeHistory> {
    const item = await this.getItem(id);
    const versions = [...item.versions]
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
      .map((version) => this.toVersionContract(version));
    return {
      id: item.id,
      combination: this.toCombination(item),
      versions,
    };
  }

  /**
   * Referências validadas antes do insert, com 404 nomeando qual falta — a
   * FK do banco fica como cinturão (design D2).
   */
  private async assertReferencesExist(dto: CreateFoundationVolumeDto) {
    const [towerType, soilType, foundationType] = await Promise.all([
      this.prisma.towerType.findUnique({ where: { id: dto.towerTypeId } }),
      this.prisma.soilType.findUnique({ where: { id: dto.soilTypeId } }),
      this.prisma.foundationType.findUnique({
        where: { id: dto.foundationTypeId },
      }),
    ]);
    if (!towerType) {
      throw new NotFoundException('Tipo de torre não encontrado');
    }
    if (!soilType) {
      throw new NotFoundException('Tipo de solo não encontrado');
    }
    if (!foundationType) {
      throw new NotFoundException('Tipo de fundação não encontrado');
    }
  }

  private async getItem(id: number): Promise<ItemWithRefs> {
    const item = await this.prisma.foundationVolume.findUnique({
      where: { id },
      include: ITEM_INCLUDE,
    });
    if (!item) {
      throw new NotFoundException(
        'Entrada da matriz de volumes não encontrada',
      );
    }
    return item;
  }

  private toCombination(item: ItemWithRefs): FoundationVolumeCombination {
    return {
      towerTypeId: item.towerTypeId,
      seriesName: item.towerType.structureSeries.name,
      towerCode: item.towerType.code,
      soilTypeId: item.soilTypeId,
      soilCode: item.soilType.code,
      foundationTypeId: item.foundationTypeId,
      foundationCode: item.foundationType.code,
    };
  }

  private toSummary(
    item: ItemWithRefs,
    row: FoundationVolumeVersionRow | undefined,
  ): FoundationVolumeSummary {
    const effective = row ? this.toVersionContract(row) : null;
    const allQuantitiesMissing =
      effective !== null &&
      FOUNDATION_VOLUME_QUANTITY_FIELDS.every((field) =>
        isMissing(effective[field]),
      );
    return {
      id: item.id,
      combination: this.toCombination(item),
      effectiveVersion: effective,
      pendingFields: allQuantitiesMissing ? [QUANTITIES_PENDING_LABEL] : [],
    };
  }

  /** Linha Prisma → contrato da domain: Decimal→string, datas→ISO, sem FKs. */
  private toVersionContract(
    row: FoundationVolumeVersionRow,
  ): FoundationVolumeVersion {
    const quantities = Object.fromEntries(
      FOUNDATION_VOLUME_QUANTITY_FIELDS.map((field) => [
        field,
        row[field]?.toString() ?? null,
      ]),
    ) as FoundationVolumeQuantities;
    return {
      id: row.id,
      ...quantities,
      effectiveFrom: row.effectiveFrom.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVersionFields(dto: FoundationVolumeQuantitiesDto) {
    return Object.fromEntries(
      FOUNDATION_VOLUME_QUANTITY_FIELDS.map((field) => [
        field,
        dto[field] ?? null,
      ]),
    ) as FoundationVolumeQuantities;
  }
}
