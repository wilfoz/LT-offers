import {
  StructureSeriesHistory,
  StructureSeriesSummary,
  StructureSeriesVersion,
} from '@lt-offers/domain';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { StructureSeriesVersion as StructureSeriesVersionRow } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from './civil-date';
import { CreateStructureSeriesDto } from './dto/create-structure-series.dto';
import { CreateStructureSeriesVersionDto } from './dto/create-structure-series-version.dto';
import { StructureSeriesVersionFieldsDto } from './dto/structure-series-version-fields.dto';
import { missingFields, resolveEffectiveVersion } from './effectiveness';
import { isUniqueViolation } from './prisma-errors';

// Rótulos exibidos ao usuário — permanecem em pt-BR (RNF-14). Obrigatórios
// para pendência (RF-11): todos os campos da versão da série (spec
// catalogos/series-torres).
const STRUCTURE_SERIES_REQUIRED_LABELS = {
  designer: 'projetista',
  voltageKv: 'tensão (kV)',
  circuitCount: 'circuitos',
  cablesPerPhase: 'cabos por fase',
  designWindSpeedMs: 'vento de projeto (m/s)',
  insulatorType: 'tipo de isolador',
  silMw: 'SIL (MW)',
} as const;

@Injectable()
export class StructureSeriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateStructureSeriesDto,
    createdBy: string,
    today: Date,
  ): Promise<StructureSeriesSummary> {
    const effectiveFrom = dto.effectiveFrom
      ? toCivilDate(dto.effectiveFrom)
      : today;

    try {
      const item = await this.prisma.structureSeries.create({
        data: {
          name: dto.name,
          versions: {
            create: {
              ...this.toVersionFields(dto),
              effectiveFrom,
              createdBy,
            },
          },
        },
        include: { versions: true },
      });
      return this.toSummary(item.id, item.name, 0, item.versions[0]);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `O nome "${dto.name}" já está em uso no catálogo`,
        );
      }
      throw error;
    }
  }

  async createVersion(
    id: number,
    dto: CreateStructureSeriesVersionDto,
    createdBy: string,
  ): Promise<StructureSeriesVersion> {
    await this.getItem(id);
    const effectiveFrom = toCivilDate(dto.effectiveFrom);

    try {
      const version = await this.prisma.structureSeriesVersion.create({
        data: {
          structureSeriesId: id,
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
    search: string | undefined,
    referenceDate: Date,
  ): Promise<StructureSeriesSummary[]> {
    const filter: Prisma.StructureSeriesWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            {
              versions: {
                some: {
                  designer: { contains: search, mode: 'insensitive' },
                },
              },
            },
          ],
        }
      : {};

    const items = await this.prisma.structureSeries.findMany({
      where: filter,
      include: { versions: true, _count: { select: { towerTypes: true } } },
      orderBy: { name: 'asc' },
    });

    return items.map((item) => {
      const effective = resolveEffectiveVersion(item.versions, referenceDate);
      return this.toSummary(
        item.id,
        item.name,
        item._count.towerTypes,
        effective,
      );
    });
  }

  async get(id: number, referenceDate: Date): Promise<StructureSeriesSummary> {
    const item = await this.getItem(id);
    const effective = resolveEffectiveVersion(item.versions, referenceDate);
    if (!effective) {
      throw new NotFoundException(
        'Não há versão vigente para a data de referência informada',
      );
    }
    return this.toSummary(
      item.id,
      item.name,
      item._count.towerTypes,
      effective,
    );
  }

  async listHistory(id: number): Promise<StructureSeriesHistory> {
    const item = await this.getItem(id);
    const versions = [...item.versions]
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
      .map((version) => this.toVersionContract(version));
    return { id: item.id, name: item.name, versions };
  }

  private async getItem(id: number) {
    const item = await this.prisma.structureSeries.findUnique({
      where: { id },
      include: { versions: true, _count: { select: { towerTypes: true } } },
    });
    if (!item) {
      throw new NotFoundException('Série de estrutura não encontrada');
    }
    return item;
  }

  private toSummary(
    id: number,
    name: string,
    towerTypeCount: number,
    row: StructureSeriesVersionRow | undefined,
  ): StructureSeriesSummary {
    const effective = row ? this.toVersionContract(row) : null;
    return {
      id,
      name,
      towerTypeCount,
      effectiveVersion: effective,
      pendingFields: effective
        ? missingFields(effective, STRUCTURE_SERIES_REQUIRED_LABELS)
        : [],
    };
  }

  /** Linha Prisma → contrato da domain: Decimal→string, datas→ISO, sem FKs. */
  private toVersionContract(
    row: StructureSeriesVersionRow,
  ): StructureSeriesVersion {
    return {
      id: row.id,
      designer: row.designer ?? null,
      voltageKv: row.voltageKv?.toString() ?? null,
      circuitCount: row.circuitCount ?? null,
      cablesPerPhase: row.cablesPerPhase ?? null,
      designWindSpeedMs: row.designWindSpeedMs?.toString() ?? null,
      insulatorType: row.insulatorType ?? null,
      silMw: row.silMw?.toString() ?? null,
      effectiveFrom: row.effectiveFrom.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVersionFields(dto: StructureSeriesVersionFieldsDto) {
    return {
      designer: dto.designer ?? null,
      voltageKv: dto.voltageKv ?? null,
      circuitCount: dto.circuitCount ?? null,
      cablesPerPhase: dto.cablesPerPhase ?? null,
      designWindSpeedMs: dto.designWindSpeedMs ?? null,
      insulatorType: dto.insulatorType ?? null,
      silMw: dto.silMw ?? null,
    };
  }
}
