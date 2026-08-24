import {
  GuyWireHistory,
  GuyWireSummary,
  GuyWireVersion,
} from '@lt-offers/domain';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { GuyWireVersion as GuyWireVersionRow } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from './civil-date';
import { CreateGuyWireDto } from './dto/create-guy-wire.dto';
import { CreateGuyWireVersionDto } from './dto/create-guy-wire-version.dto';
import { GuyWireVersionFieldsDto } from './dto/guy-wire-version-fields.dto';
import { missingFields, resolveEffectiveVersion } from './effectiveness';
import { isUniqueViolation } from './prisma-errors';

// Rótulos exibidos ao usuário — permanecem em pt-BR (RNF-14). Obrigatórios
// para pendência (RF-11): comuns + galvanização/grau/fios; descrição fora
// (spec catalogos/cabos-tirante).
const GUY_WIRE_REQUIRED_LABELS = {
  weightTonPerKm: 'peso (ton/km)',
  reelLengthM: 'bobina (m)',
  diameterMm: 'diâmetro (mm)',
  utsKn: 'UTS (kN)',
  galvanizationClass: 'classe de galvanização',
  strengthGrade: 'grau de resistência',
  wireCount: 'número de fios',
} as const;

@Injectable()
export class GuyWiresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateGuyWireDto,
    createdBy: string,
    today: Date,
  ): Promise<GuyWireSummary> {
    const effectiveFrom = dto.effectiveFrom
      ? toCivilDate(dto.effectiveFrom)
      : today;

    try {
      const item = await this.prisma.guyWire.create({
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
    dto: CreateGuyWireVersionDto,
    createdBy: string,
  ): Promise<GuyWireVersion> {
    await this.getItem(id);
    const effectiveFrom = toCivilDate(dto.effectiveFrom);

    try {
      const version = await this.prisma.guyWireVersion.create({
        data: {
          guyWireId: id,
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
  ): Promise<GuyWireSummary[]> {
    const filter: Prisma.GuyWireWhereInput = search
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

    const items = await this.prisma.guyWire.findMany({
      where: filter,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map((item) => {
      const effective = resolveEffectiveVersion(item.versions, referenceDate);
      return this.toSummary(item.id, item.code, effective);
    });
  }

  async get(id: number, referenceDate: Date): Promise<GuyWireSummary> {
    const item = await this.getItem(id);
    const effective = resolveEffectiveVersion(item.versions, referenceDate);
    if (!effective) {
      throw new NotFoundException(
        'Não há versão vigente para a data de referência informada',
      );
    }
    return this.toSummary(item.id, item.code, effective);
  }

  async listHistory(id: number): Promise<GuyWireHistory> {
    const item = await this.getItem(id);
    const versions = [...item.versions]
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
      .map((version) => this.toVersionContract(version));
    return { id: item.id, code: item.code, versions };
  }

  private async getItem(id: number) {
    const item = await this.prisma.guyWire.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!item) {
      throw new NotFoundException('Cabo de tirante não encontrado');
    }
    return item;
  }

  private toSummary(
    id: number,
    code: string,
    row: GuyWireVersionRow | undefined,
  ): GuyWireSummary {
    const effective = row ? this.toVersionContract(row) : null;
    return {
      id,
      code,
      effectiveVersion: effective,
      pendingFields: effective
        ? missingFields(effective, GUY_WIRE_REQUIRED_LABELS)
        : [],
    };
  }

  /** Linha Prisma → contrato da domain: Decimal→string, datas→ISO, sem FKs. */
  private toVersionContract(row: GuyWireVersionRow): GuyWireVersion {
    return {
      id: row.id,
      description: row.description ?? null,
      weightTonPerKm: row.weightTonPerKm?.toString() ?? null,
      reelLengthM: row.reelLengthM?.toString() ?? null,
      diameterMm: row.diameterMm?.toString() ?? null,
      utsKn: row.utsKn?.toString() ?? null,
      galvanizationClass: row.galvanizationClass ?? null,
      strengthGrade: row.strengthGrade ?? null,
      wireCount: row.wireCount ?? null,
      effectiveFrom: row.effectiveFrom.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVersionFields(dto: GuyWireVersionFieldsDto) {
    return {
      description: dto.description ?? null,
      weightTonPerKm: dto.weightTonPerKm ?? null,
      reelLengthM: dto.reelLengthM ?? null,
      diameterMm: dto.diameterMm ?? null,
      utsKn: dto.utsKn ?? null,
      galvanizationClass: dto.galvanizationClass ?? null,
      strengthGrade: dto.strengthGrade ?? null,
      wireCount: dto.wireCount ?? null,
    };
  }
}
