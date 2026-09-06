import {
  FixedCostCategory,
  FixedCostHistory,
  FixedCostSummary,
  FixedCostVersion,
} from '@lt-offers/domain';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FixedCostCategory as PrismaFixedCostCategory, Prisma } from '@prisma/client';
import type { FixedCostVersion as FixedCostVersionRow } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from './civil-date';
import { CreateFixedCostDto } from './dto/create-fixed-cost.dto';
import { CreateFixedCostVersionDto } from './dto/create-fixed-cost-version.dto';
import { FixedCostVersionFieldsDto } from './dto/fixed-cost-version-fields.dto';
import { missingFields, resolveEffectiveVersion } from './effectiveness';
import { isUniqueViolation } from './prisma-errors';

const FIXED_COST_REQUIRED_LABELS = {
  unitCost: 'custo unitário (R$)',
  unit: 'unidade',
} as const;

@Injectable()
export class FixedCostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateFixedCostDto,
    createdBy: string,
    today: Date,
  ): Promise<FixedCostSummary> {
    const effectiveFrom = dto.effectiveFrom
      ? toCivilDate(dto.effectiveFrom)
      : today;

    try {
      const item = await this.prisma.fixedCost.create({
        data: {
          code: dto.code,
          description: dto.description,
          category: dto.category as PrismaFixedCostCategory,
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
      return this.toSummary(
        item.id,
        item.code,
        item.description,
        item.category as FixedCostCategory,
        item.versions[0],
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `O código "${dto.code}" já está em uso no catálogo`,
        );
      }
      throw error;
    }
  }

  async createVersion(
    id: number,
    dto: CreateFixedCostVersionDto,
    createdBy: string,
  ): Promise<FixedCostVersion> {
    await this.getItem(id);
    const effectiveFrom = toCivilDate(dto.effectiveFrom);

    try {
      const version = await this.prisma.fixedCostVersion.create({
        data: {
          fixedCostId: id,
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
    category: string | undefined,
    referenceDate: Date,
  ): Promise<FixedCostSummary[]> {
    const where: Prisma.FixedCostWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { equals: category as PrismaFixedCostCategory };
    }

    const items = await this.prisma.fixedCost.findMany({
      where,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map((item) => {
      const effective = resolveEffectiveVersion(item.versions, referenceDate);
      return this.toSummary(
        item.id,
        item.code,
        item.description,
        item.category as FixedCostCategory,
        effective,
      );
    });
  }

  async get(id: number, referenceDate: Date): Promise<FixedCostSummary> {
    const item = await this.getItem(id);
    const effective = resolveEffectiveVersion(item.versions, referenceDate);
    if (!effective) {
      throw new NotFoundException(
        'Não há versão vigente para a data de referência informada',
      );
    }
    return this.toSummary(
      item.id,
      item.code,
      item.description,
      item.category as FixedCostCategory,
      effective,
    );
  }

  async listHistory(id: number): Promise<FixedCostHistory> {
    const item = await this.getItem(id);
    const versions = [...item.versions]
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
      .map((version) => this.toVersionContract(version));
    return {
      id: item.id,
      code: item.code,
      description: item.description,
      category: item.category as FixedCostCategory,
      versions,
    };
  }

  private async getItem(id: number) {
    const item = await this.prisma.fixedCost.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!item) {
      throw new NotFoundException('Custo fixo não encontrado');
    }
    return item;
  }

  private toSummary(
    id: number,
    code: string,
    description: string,
    category: FixedCostCategory,
    row: FixedCostVersionRow | undefined,
  ): FixedCostSummary {
    const effective = row ? this.toVersionContract(row) : null;
    const pending: string[] = [];

    if (!description?.trim()) {
      pending.push('descrição');
    }
    if (effective) {
      pending.push(...missingFields(effective, FIXED_COST_REQUIRED_LABELS));
    }

    return {
      id,
      code,
      description,
      category,
      effectiveVersion: effective,
      pendingFields: pending,
    };
  }

  /** Linha Prisma → contrato da domain: Decimal→string, datas→ISO, sem FKs. */
  private toVersionContract(row: FixedCostVersionRow): FixedCostVersion {
    return {
      id: row.id,
      unitCost: row.unitCost?.toString() ?? null,
      unit: row.unit ?? null,
      effectiveFrom: row.effectiveFrom.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVersionFields(dto: FixedCostVersionFieldsDto) {
    return {
      unitCost: dto.unitCost ?? null,
      unit: dto.unit ?? null,
    };
  }
}
