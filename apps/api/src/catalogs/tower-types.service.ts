import {
  TowerTypeHistory,
  TowerTypeSummary,
  TowerTypeVersion,
} from '@lt-offers/domain';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  TowerTypeVersion as TowerTypeVersionRow,
  TowerTypeWeight as TowerTypeWeightRow,
} from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from './civil-date';
import { CreateTowerTypeDto } from './dto/create-tower-type.dto';
import { CreateTowerTypeVersionDto } from './dto/create-tower-type-version.dto';
import { TowerTypeVersionFieldsDto } from './dto/tower-type-version-fields.dto';
import { missingFields, resolveEffectiveVersion } from './effectiveness';
import { isUniqueViolation } from './prisma-errors';

// Linha de versão com a tabela peso × altura carregada junto (a tabela
// pertence à versão e é imutável com ela — design D1).
type VersionWithWeights = TowerTypeVersionRow & {
  weights: TowerTypeWeightRow[];
};

// Rótulos exibidos ao usuário — permanecem em pt-BR (RNF-14). Obrigatórios
// para pendência (RF-11): estais e ao menos um ponto na tabela; missingFields
// só cobre campos escalares, a tabela é verificada em composição (design D3).
const TOWER_TYPE_REQUIRED_LABELS = {
  guyCount: 'quantidade de estais',
} as const;

const WEIGHT_TABLE_LABEL = 'tabela peso × altura';

const WEIGHTS_INCLUDE = {
  weights: { orderBy: { heightM: 'asc' } },
} as const;

@Injectable()
export class TowerTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    seriesId: number,
    dto: CreateTowerTypeDto,
    createdBy: string,
    today: Date,
  ): Promise<TowerTypeSummary> {
    await this.getSeries(seriesId);
    const effectiveFrom = dto.effectiveFrom
      ? toCivilDate(dto.effectiveFrom)
      : today;

    try {
      const item = await this.prisma.towerType.create({
        data: {
          structureSeriesId: seriesId,
          code: dto.code,
          function: dto.function,
          versions: {
            create: {
              guyCount: dto.guyCount ?? null,
              weights: this.toWeightsCreate(dto),
              effectiveFrom,
              createdBy,
            },
          },
        },
        include: { versions: { include: WEIGHTS_INCLUDE } },
      });
      return this.toSummary(
        item.id,
        item.code,
        item.function,
        item.versions[0],
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `A sigla "${dto.code}" já está em uso nesta série`,
        );
      }
      throw error;
    }
  }

  async createVersion(
    seriesId: number,
    id: number,
    dto: CreateTowerTypeVersionDto,
    createdBy: string,
  ): Promise<TowerTypeVersion> {
    await this.getItem(seriesId, id);
    const effectiveFrom = toCivilDate(dto.effectiveFrom);

    try {
      const version = await this.prisma.towerTypeVersion.create({
        data: {
          towerTypeId: id,
          guyCount: dto.guyCount ?? null,
          weights: this.toWeightsCreate(dto),
          effectiveFrom,
          createdBy,
        },
        include: WEIGHTS_INCLUDE,
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
    seriesId: number,
    referenceDate: Date,
  ): Promise<TowerTypeSummary[]> {
    await this.getSeries(seriesId);
    const items = await this.prisma.towerType.findMany({
      where: { structureSeriesId: seriesId },
      include: { versions: { include: WEIGHTS_INCLUDE } },
      orderBy: { code: 'asc' },
    });

    return items.map((item) => {
      const effective = resolveEffectiveVersion(item.versions, referenceDate);
      return this.toSummary(item.id, item.code, item.function, effective);
    });
  }

  async get(
    seriesId: number,
    id: number,
    referenceDate: Date,
  ): Promise<TowerTypeSummary> {
    const item = await this.getItem(seriesId, id);
    const effective = resolveEffectiveVersion(item.versions, referenceDate);
    if (!effective) {
      throw new NotFoundException(
        'Não há versão vigente para a data de referência informada',
      );
    }
    return this.toSummary(item.id, item.code, item.function, effective);
  }

  async listHistory(seriesId: number, id: number): Promise<TowerTypeHistory> {
    const item = await this.getItem(seriesId, id);
    const versions = [...item.versions]
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
      .map((version) => this.toVersionContract(version));
    return { id: item.id, code: item.code, function: item.function, versions };
  }

  private async getSeries(seriesId: number) {
    const series = await this.prisma.structureSeries.findUnique({
      where: { id: seriesId },
    });
    if (!series) {
      throw new NotFoundException('Série de estrutura não encontrada');
    }
    return series;
  }

  // Pertencimento série↔tipo verificado em toda operação (design D2): o tipo
  // só existe no contexto da própria série; id de outra série responde 404.
  private async getItem(seriesId: number, id: number) {
    await this.getSeries(seriesId);
    const item = await this.prisma.towerType.findFirst({
      where: { id, structureSeriesId: seriesId },
      include: { versions: { include: WEIGHTS_INCLUDE } },
    });
    if (!item) {
      throw new NotFoundException('Tipo de torre não encontrado nesta série');
    }
    return item;
  }

  private toSummary(
    id: number,
    code: string,
    towerFunction: TowerTypeSummary['function'],
    row: VersionWithWeights | undefined,
  ): TowerTypeSummary {
    const effective = row ? this.toVersionContract(row) : null;
    const pendingFields = effective
      ? missingFields(effective, TOWER_TYPE_REQUIRED_LABELS)
      : [];
    if (effective && effective.weights.length === 0) {
      pendingFields.push(WEIGHT_TABLE_LABEL);
    }
    return {
      id,
      code,
      function: towerFunction,
      effectiveVersion: effective,
      pendingFields,
    };
  }

  /** Linha Prisma → contrato da domain: Decimal→string, datas→ISO, sem FKs. */
  private toVersionContract(row: VersionWithWeights): TowerTypeVersion {
    return {
      id: row.id,
      guyCount: row.guyCount ?? null,
      weights: row.weights.map((weight) => ({
        heightM: weight.heightM.toString(),
        weightKg: weight.weightKg.toString(),
      })),
      effectiveFrom: row.effectiveFrom.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toWeightsCreate(dto: TowerTypeVersionFieldsDto) {
    if (!dto.weights?.length) {
      return undefined;
    }
    return {
      create: dto.weights.map((point) => ({
        heightM: point.heightM,
        weightKg: point.weightKg,
      })),
    };
  }
}
