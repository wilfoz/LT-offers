import {
  FOUNDATION_ELEMENT_COUNT_FIELDS,
  FoundationApplication,
  FoundationElementCounts,
  FoundationTypeHistory,
  FoundationTypeSummary,
  FoundationTypeVersion,
} from '@lt-offers/domain';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { FoundationTypeVersion as FoundationTypeVersionRow } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from './civil-date';
import { CreateFoundationTypeDto } from './dto/create-foundation-type.dto';
import { CreateFoundationTypeVersionDto } from './dto/create-foundation-type-version.dto';
import { FoundationTypeVersionFieldsDto } from './dto/foundation-type-version-fields.dto';
import {
  isMissing,
  missingFields,
  resolveEffectiveVersion,
} from './effectiveness';
import { isUniqueViolation } from './prisma-errors';

// Rótulos exibidos ao usuário — permanecem em pt-BR (RNF-14). Além da
// descrição, a pendência composta exige ao menos um elemento com contagem
// informada (rótulo "composição por elemento") — missingFields só olha campos
// escalares, limite conhecido da base (design D3).
const FOUNDATION_TYPE_REQUIRED_LABELS = {
  description: 'descrição',
} as const;

const COMPOSITION_LABEL = 'composição por elemento';

@Injectable()
export class FoundationTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateFoundationTypeDto,
    createdBy: string,
    today: Date,
  ): Promise<FoundationTypeSummary> {
    const effectiveFrom = dto.effectiveFrom
      ? toCivilDate(dto.effectiveFrom)
      : today;

    try {
      const item = await this.prisma.foundationType.create({
        data: {
          code: dto.code,
          application: dto.application,
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
        item.application,
        item.versions[0],
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `A sigla "${dto.code}" já está em uso no catálogo`,
        );
      }
      throw error;
    }
  }

  async createVersion(
    id: number,
    dto: CreateFoundationTypeVersionDto,
    createdBy: string,
  ): Promise<FoundationTypeVersion> {
    await this.getItem(id);
    const effectiveFrom = toCivilDate(dto.effectiveFrom);

    try {
      const version = await this.prisma.foundationTypeVersion.create({
        data: {
          foundationTypeId: id,
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
    application: FoundationApplication | undefined,
    referenceDate: Date,
  ): Promise<FoundationTypeSummary[]> {
    const searchFilter: Prisma.FoundationTypeWhereInput = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            {
              versions: {
                some: {
                  description: { contains: search, mode: 'insensitive' },
                },
              },
            },
          ],
        }
      : {};

    const items = await this.prisma.foundationType.findMany({
      where: { ...searchFilter, ...(application ? { application } : {}) },
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map((item) => {
      const effective = resolveEffectiveVersion(item.versions, referenceDate);
      return this.toSummary(item.id, item.code, item.application, effective);
    });
  }

  async get(id: number, referenceDate: Date): Promise<FoundationTypeSummary> {
    const item = await this.getItem(id);
    const effective = resolveEffectiveVersion(item.versions, referenceDate);
    if (!effective) {
      throw new NotFoundException(
        'Não há versão vigente para a data de referência informada',
      );
    }
    return this.toSummary(item.id, item.code, item.application, effective);
  }

  async listHistory(id: number): Promise<FoundationTypeHistory> {
    const item = await this.getItem(id);
    const versions = [...item.versions]
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
      .map((version) => this.toVersionContract(version));
    return {
      id: item.id,
      code: item.code,
      application: item.application,
      versions,
    };
  }

  private async getItem(id: number) {
    const item = await this.prisma.foundationType.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!item) {
      throw new NotFoundException('Tipo de fundação não encontrado');
    }
    return item;
  }

  private toSummary(
    id: number,
    code: string,
    application: FoundationApplication,
    row: FoundationTypeVersionRow | undefined,
  ): FoundationTypeSummary {
    const effective = row ? this.toVersionContract(row) : null;
    const pendingFields = effective
      ? missingFields(effective, FOUNDATION_TYPE_REQUIRED_LABELS)
      : [];
    // Pendência composta: nenhuma contagem informada = composição ausente;
    // contagem zero é valor (RNF-09), não pendência.
    if (
      effective &&
      FOUNDATION_ELEMENT_COUNT_FIELDS.every((field) =>
        isMissing(effective[field]),
      )
    ) {
      pendingFields.push(COMPOSITION_LABEL);
    }
    return {
      id,
      code,
      application,
      effectiveVersion: effective,
      pendingFields,
    };
  }

  /** Linha Prisma → contrato da domain: contagens preservadas, datas→ISO. */
  private toVersionContract(
    row: FoundationTypeVersionRow,
  ): FoundationTypeVersion {
    const counts = Object.fromEntries(
      FOUNDATION_ELEMENT_COUNT_FIELDS.map((field) => [
        field,
        row[field] ?? null,
      ]),
    ) as FoundationElementCounts;
    return {
      id: row.id,
      description: row.description ?? null,
      ...counts,
      effectiveFrom: row.effectiveFrom.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVersionFields(dto: FoundationTypeVersionFieldsDto) {
    const counts = Object.fromEntries(
      FOUNDATION_ELEMENT_COUNT_FIELDS.map((field) => [
        field,
        dto[field] ?? null,
      ]),
    ) as FoundationElementCounts;
    return {
      description: dto.description ?? null,
      ...counts,
    };
  }
}
