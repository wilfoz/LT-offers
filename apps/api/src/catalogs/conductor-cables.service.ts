import {
  ConductorCableHistory,
  ConductorCableSummary,
  ConductorCableVersion,
} from '@lt-offers/domain';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ConductorCableVersion as ConductorCableVersionRow } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from './civil-date';
import { CreateConductorCableDto } from './dto/create-conductor-cable.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { VersionFieldsDto } from './dto/version-fields.dto';
import { missingFields, resolveEffectiveVersion } from './effectiveness';
import { isUniqueViolation } from './prisma-errors';

// Rótulos exibidos ao usuário — permanecem em pt-BR (RNF-14)
export const CONDUCTOR_CABLE_REQUIRED_LABELS = {
  description: 'descrição',
  weightTonPerKm: 'peso (ton/km)',
  reelLengthM: 'bobina (m)',
  diameterMm: 'diâmetro (mm)',
  utsKn: 'UTS (kN)',
} as const;

@Injectable()
export class ConductorCablesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateConductorCableDto,
    createdBy: string,
    today: Date,
  ): Promise<ConductorCableSummary> {
    const effectiveFrom = dto.effectiveFrom
      ? toCivilDate(dto.effectiveFrom)
      : today;

    try {
      const item = await this.prisma.conductorCable.create({
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
    dto: CreateVersionDto,
    createdBy: string,
  ): Promise<ConductorCableVersion> {
    await this.getItem(id);
    const effectiveFrom = toCivilDate(dto.effectiveFrom);

    try {
      const version = await this.prisma.conductorCableVersion.create({
        data: {
          conductorCableId: id,
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
  ): Promise<ConductorCableSummary[]> {
    const filter: Prisma.ConductorCableWhereInput = search
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

    const items = await this.prisma.conductorCable.findMany({
      where: filter,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map((item) => {
      const effective = resolveEffectiveVersion(item.versions, referenceDate);
      return this.toSummary(item.id, item.code, effective);
    });
  }

  async get(id: number, referenceDate: Date): Promise<ConductorCableSummary> {
    const item = await this.getItem(id);
    const effective = resolveEffectiveVersion(item.versions, referenceDate);
    if (!effective) {
      throw new NotFoundException(
        'Não há versão vigente para a data de referência informada',
      );
    }
    return this.toSummary(item.id, item.code, effective);
  }

  async listHistory(id: number): Promise<ConductorCableHistory> {
    const item = await this.getItem(id);
    const versions = [...item.versions]
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
      .map((version) => this.toVersionContract(version));
    return { id: item.id, code: item.code, versions };
  }

  private async getItem(id: number) {
    const item = await this.prisma.conductorCable.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!item) {
      throw new NotFoundException('Cabo condutor não encontrado');
    }
    return item;
  }

  private toSummary(
    id: number,
    code: string,
    row: ConductorCableVersionRow | undefined,
  ): ConductorCableSummary {
    const effective = row ? this.toVersionContract(row) : null;
    return {
      id,
      code,
      effectiveVersion: effective,
      pendingFields: effective
        ? missingFields(effective, CONDUCTOR_CABLE_REQUIRED_LABELS)
        : [],
    };
  }

  /** Linha Prisma → contrato da domain: Decimal→string, datas→ISO, sem FKs. */
  private toVersionContract(
    row: ConductorCableVersionRow,
  ): ConductorCableVersion {
    return {
      id: row.id,
      description: row.description ?? null,
      weightTonPerKm: row.weightTonPerKm?.toString() ?? null,
      reelLengthM: row.reelLengthM?.toString() ?? null,
      diameterMm: row.diameterMm?.toString() ?? null,
      utsKn: row.utsKn?.toString() ?? null,
      effectiveFrom: row.effectiveFrom.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVersionFields(dto: VersionFieldsDto) {
    return {
      description: dto.description ?? null,
      weightTonPerKm: dto.weightTonPerKm ?? null,
      reelLengthM: dto.reelLengthM ?? null,
      diameterMm: dto.diameterMm ?? null,
      utsKn: dto.utsKn ?? null,
    };
  }
}
