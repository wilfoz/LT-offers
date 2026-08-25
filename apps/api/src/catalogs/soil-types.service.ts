import {
  SoilTypeHistory,
  SoilTypeSummary,
  SoilTypeVersion,
} from '@lt-offers/domain';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { SoilTypeVersion as SoilTypeVersionRow } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from './civil-date';
import { CreateSoilTypeDto } from './dto/create-soil-type.dto';
import { CreateSoilTypeVersionDto } from './dto/create-soil-type-version.dto';
import { SoilTypeVersionFieldsDto } from './dto/soil-type-version-fields.dto';
import { missingFields, resolveEffectiveVersion } from './effectiveness';
import { isUniqueViolation } from './prisma-errors';

// Rótulos exibidos ao usuário — permanecem em pt-BR (RNF-14). Obrigatórios
// para pendência (RF-11): coesão e faixa de NSPT ficam fora porque não se
// aplicam a rocha (spec catalogos/solos-fundacoes).
const SOIL_TYPE_REQUIRED_LABELS = {
  description: 'descrição',
  submerged: 'submerso',
  allowableCompressionStressKgfCm2: 'tensão admissível à compressão (kgf/cm²)',
  specificWeightKgfM3: 'peso específico (kgf/m³)',
  internalFrictionAngleDeg: 'ângulo de atrito interno (°)',
} as const;

@Injectable()
export class SoilTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateSoilTypeDto,
    createdBy: string,
    today: Date,
  ): Promise<SoilTypeSummary> {
    const effectiveFrom = dto.effectiveFrom
      ? toCivilDate(dto.effectiveFrom)
      : today;

    try {
      const item = await this.prisma.soilType.create({
        data: {
          code: dto.code,
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
      return this.toSummary(item.id, item.code, item.versions[0]);
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
    dto: CreateSoilTypeVersionDto,
    createdBy: string,
  ): Promise<SoilTypeVersion> {
    await this.getItem(id);
    const effectiveFrom = toCivilDate(dto.effectiveFrom);

    try {
      const version = await this.prisma.soilTypeVersion.create({
        data: {
          soilTypeId: id,
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
  ): Promise<SoilTypeSummary[]> {
    const filter: Prisma.SoilTypeWhereInput = search
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

    const items = await this.prisma.soilType.findMany({
      where: filter,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map((item) => {
      const effective = resolveEffectiveVersion(item.versions, referenceDate);
      return this.toSummary(item.id, item.code, effective);
    });
  }

  async get(id: number, referenceDate: Date): Promise<SoilTypeSummary> {
    const item = await this.getItem(id);
    const effective = resolveEffectiveVersion(item.versions, referenceDate);
    if (!effective) {
      throw new NotFoundException(
        'Não há versão vigente para a data de referência informada',
      );
    }
    return this.toSummary(item.id, item.code, effective);
  }

  async listHistory(id: number): Promise<SoilTypeHistory> {
    const item = await this.getItem(id);
    const versions = [...item.versions]
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
      .map((version) => this.toVersionContract(version));
    return { id: item.id, code: item.code, versions };
  }

  private async getItem(id: number) {
    const item = await this.prisma.soilType.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!item) {
      throw new NotFoundException('Tipo de solo não encontrado');
    }
    return item;
  }

  private toSummary(
    id: number,
    code: string,
    row: SoilTypeVersionRow | undefined,
  ): SoilTypeSummary {
    const effective = row ? this.toVersionContract(row) : null;
    return {
      id,
      code,
      effectiveVersion: effective,
      pendingFields: effective
        ? missingFields(effective, SOIL_TYPE_REQUIRED_LABELS)
        : [],
    };
  }

  /** Linha Prisma → contrato da domain: Decimal→string, datas→ISO, sem FKs. */
  private toVersionContract(row: SoilTypeVersionRow): SoilTypeVersion {
    return {
      id: row.id,
      description: row.description ?? null,
      submerged: row.submerged ?? null,
      allowableCompressionStressKgfCm2:
        row.allowableCompressionStressKgfCm2?.toString() ?? null,
      specificWeightKgfM3: row.specificWeightKgfM3?.toString() ?? null,
      internalFrictionAngleDeg:
        row.internalFrictionAngleDeg?.toString() ?? null,
      cohesionKgCm2: row.cohesionKgCm2?.toString() ?? null,
      nsptMin: row.nsptMin ?? null,
      nsptMax: row.nsptMax ?? null,
      effectiveFrom: row.effectiveFrom.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVersionFields(dto: SoilTypeVersionFieldsDto) {
    return {
      description: dto.description ?? null,
      submerged: dto.submerged ?? null,
      allowableCompressionStressKgfCm2:
        dto.allowableCompressionStressKgfCm2 ?? null,
      specificWeightKgfM3: dto.specificWeightKgfM3 ?? null,
      internalFrictionAngleDeg: dto.internalFrictionAngleDeg ?? null,
      cohesionKgCm2: dto.cohesionKgCm2 ?? null,
      nsptMin: dto.nsptMin ?? null,
      nsptMax: dto.nsptMax ?? null,
    };
  }
}
