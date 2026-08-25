import {
  InsulatorHistory,
  InsulatorSummary,
  InsulatorVersion,
} from '@lt-offers/domain';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { InsulatorVersion as InsulatorVersionRow } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from './civil-date';
import { CreateInsulatorDto } from './dto/create-insulator.dto';
import { CreateInsulatorVersionDto } from './dto/create-insulator-version.dto';
import { InsulatorVersionFieldsDto } from './dto/insulator-version-fields.dto';
import { missingFields, resolveEffectiveVersion } from './effectiveness';
import { isUniqueViolation } from './prisma-errors';

// Rótulos exibidos ao usuário — permanecem em pt-BR (RNF-14). Obrigatórios
// para pendência (RF-11): campos técnicos; fabricante e descrição fora
// (spec catalogos/isoladores).
const INSULATOR_REQUIRED_LABELS = {
  type: 'tipo',
  profile: 'perfil',
  ruptureStrengthKn: 'carga de ruptura (kN)',
  diameterMm: 'diâmetro (mm)',
  spacingMm: 'passo (mm)',
  creepageDistanceMm: 'linha de fuga (mm)',
} as const;

@Injectable()
export class InsulatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateInsulatorDto,
    createdBy: string,
    today: Date,
  ): Promise<InsulatorSummary> {
    const effectiveFrom = dto.effectiveFrom
      ? toCivilDate(dto.effectiveFrom)
      : today;

    try {
      const item = await this.prisma.insulator.create({
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
    dto: CreateInsulatorVersionDto,
    createdBy: string,
  ): Promise<InsulatorVersion> {
    await this.getItem(id);
    const effectiveFrom = toCivilDate(dto.effectiveFrom);

    try {
      const version = await this.prisma.insulatorVersion.create({
        data: {
          insulatorId: id,
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
  ): Promise<InsulatorSummary[]> {
    const filter: Prisma.InsulatorWhereInput = search
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

    const items = await this.prisma.insulator.findMany({
      where: filter,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map((item) => {
      const effective = resolveEffectiveVersion(item.versions, referenceDate);
      return this.toSummary(item.id, item.code, effective);
    });
  }

  async get(id: number, referenceDate: Date): Promise<InsulatorSummary> {
    const item = await this.getItem(id);
    const effective = resolveEffectiveVersion(item.versions, referenceDate);
    if (!effective) {
      throw new NotFoundException(
        'Não há versão vigente para a data de referência informada',
      );
    }
    return this.toSummary(item.id, item.code, effective);
  }

  async listHistory(id: number): Promise<InsulatorHistory> {
    const item = await this.getItem(id);
    const versions = [...item.versions]
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
      .map((version) => this.toVersionContract(version));
    return { id: item.id, code: item.code, versions };
  }

  private async getItem(id: number) {
    const item = await this.prisma.insulator.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!item) {
      throw new NotFoundException('Isolador não encontrado');
    }
    return item;
  }

  private toSummary(
    id: number,
    code: string,
    row: InsulatorVersionRow | undefined,
  ): InsulatorSummary {
    const effective = row ? this.toVersionContract(row) : null;
    return {
      id,
      code,
      effectiveVersion: effective,
      pendingFields: effective
        ? missingFields(effective, INSULATOR_REQUIRED_LABELS)
        : [],
    };
  }

  /** Linha Prisma → contrato da domain: Decimal→string, datas→ISO, sem FKs. */
  private toVersionContract(row: InsulatorVersionRow): InsulatorVersion {
    return {
      id: row.id,
      description: row.description ?? null,
      type: row.type ?? null,
      manufacturer: row.manufacturer ?? null,
      profile: row.profile ?? null,
      ruptureStrengthKn: row.ruptureStrengthKn?.toString() ?? null,
      diameterMm: row.diameterMm?.toString() ?? null,
      spacingMm: row.spacingMm?.toString() ?? null,
      creepageDistanceMm: row.creepageDistanceMm?.toString() ?? null,
      effectiveFrom: row.effectiveFrom.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVersionFields(dto: InsulatorVersionFieldsDto) {
    return {
      description: dto.description ?? null,
      type: dto.type ?? null,
      manufacturer: dto.manufacturer ?? null,
      profile: dto.profile ?? null,
      ruptureStrengthKn: dto.ruptureStrengthKn ?? null,
      diameterMm: dto.diameterMm ?? null,
      spacingMm: dto.spacingMm ?? null,
      creepageDistanceMm: dto.creepageDistanceMm ?? null,
    };
  }
}
