import {
  GroundWireHistory,
  GroundWireSummary,
  GroundWireType,
  GroundWireVersion,
} from '@lt-offers/domain';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { GroundWireVersion as GroundWireVersionRow } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from './civil-date';
import { CreateGroundWireDto } from './dto/create-ground-wire.dto';
import { CreateGroundWireVersionDto } from './dto/create-ground-wire-version.dto';
import { GroundWireVersionFieldsDto } from './dto/ground-wire-version-fields.dto';
import {
  isMissing,
  missingFields,
  resolveEffectiveVersion,
} from './effectiveness';
import { isUniqueViolation } from './prisma-errors';

// Rótulos exibidos ao usuário — permanecem em pt-BR (RNF-14)
const COMMON_REQUIRED_LABELS = {
  weightTonPerKm: 'peso (ton/km)',
  reelLengthM: 'bobina (m)',
  diameterMm: 'diâmetro (mm)',
  utsKn: 'UTS (kN)',
} as const;

const STEEL_ONLY_LABELS = {
  galvanizationClass: 'classe de galvanização',
  strengthGrade: 'grau de resistência',
  wireCount: 'número de fios',
} as const;

const OPGW_ONLY_LABELS = {
  manufacturer: 'fabricante',
  i2tKa2s: 'I²t (kA²·s)',
  fiberCount: 'número de fibras',
} as const;

type VersionFieldKey = keyof GroundWireVersionFieldsDto;

// Obrigatórios para sinalização de pendência (RF-11) por tipo; fabricante e
// descrição não geram pendência (spec catalogos/cabos-guarda).
const REQUIRED_BY_TYPE: Record<
  GroundWireType,
  Partial<Record<VersionFieldKey, string>>
> = {
  STEEL: { ...COMMON_REQUIRED_LABELS, ...STEEL_ONLY_LABELS },
  OPGW: {
    ...COMMON_REQUIRED_LABELS,
    i2tKa2s: OPGW_ONLY_LABELS.i2tKa2s,
    fiberCount: OPGW_ONLY_LABELS.fiberCount,
  },
};

const TYPE_LABELS: Record<GroundWireType, string> = {
  STEEL: 'aço',
  OPGW: 'OPGW',
};

@Injectable()
export class GroundWiresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateGroundWireDto,
    createdBy: string,
    today: Date,
  ): Promise<GroundWireSummary> {
    this.assertFieldsApplyToType(dto.type, dto);
    const effectiveFrom = dto.effectiveFrom
      ? toCivilDate(dto.effectiveFrom)
      : today;

    try {
      const item = await this.prisma.groundWire.create({
        data: {
          code: dto.code,
          type: dto.type,
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
      return this.toSummary(item.id, item.code, item.type, item.versions[0]);
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
    dto: CreateGroundWireVersionDto,
    createdBy: string,
  ): Promise<GroundWireVersion> {
    const item = await this.getItem(id);
    this.assertFieldsApplyToType(item.type, dto);
    const effectiveFrom = toCivilDate(dto.effectiveFrom);

    try {
      const version = await this.prisma.groundWireVersion.create({
        data: {
          groundWireId: id,
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
    type: GroundWireType | undefined,
    referenceDate: Date,
  ): Promise<GroundWireSummary[]> {
    const searchFilter: Prisma.GroundWireWhereInput = search
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

    const items = await this.prisma.groundWire.findMany({
      where: { ...searchFilter, ...(type ? { type } : {}) },
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map((item) => {
      const effective = resolveEffectiveVersion(item.versions, referenceDate);
      return this.toSummary(item.id, item.code, item.type, effective);
    });
  }

  async get(id: number, referenceDate: Date): Promise<GroundWireSummary> {
    const item = await this.getItem(id);
    const effective = resolveEffectiveVersion(item.versions, referenceDate);
    if (!effective) {
      throw new NotFoundException(
        'Não há versão vigente para a data de referência informada',
      );
    }
    return this.toSummary(item.id, item.code, item.type, effective);
  }

  async listHistory(id: number): Promise<GroundWireHistory> {
    const item = await this.getItem(id);
    const versions = [...item.versions]
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
      .map((version) => this.toVersionContract(version));
    return { id: item.id, code: item.code, type: item.type, versions };
  }

  /**
   * Aplicabilidade por tipo (design D1 da change do catálogo): campo
   * específico do outro tipo é rejeitado com 400 apontando o campo — a
   * invariante do banco (colunas anuláveis) é garantida aqui, na única via
   * de escrita.
   */
  private assertFieldsApplyToType(
    type: GroundWireType,
    dto: GroundWireVersionFieldsDto,
  ) {
    const foreign = type === 'STEEL' ? OPGW_ONLY_LABELS : STEEL_ONLY_LABELS;
    const offending = (Object.keys(foreign) as (keyof typeof foreign)[])
      .filter((field) => !isMissing(dto[field]))
      .map((field) => foreign[field]);

    if (offending.length > 0) {
      throw new BadRequestException(
        `Os campos a seguir não se aplicam ao tipo ${TYPE_LABELS[type]}: ${offending.join(', ')}`,
      );
    }
  }

  private async getItem(id: number) {
    const item = await this.prisma.groundWire.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!item) {
      throw new NotFoundException('Cabo de guarda não encontrado');
    }
    return item;
  }

  private toSummary(
    id: number,
    code: string,
    type: GroundWireType,
    row: GroundWireVersionRow | undefined,
  ): GroundWireSummary {
    const effective = row ? this.toVersionContract(row) : null;
    return {
      id,
      code,
      type,
      effectiveVersion: effective,
      pendingFields: effective
        ? missingFields(effective, REQUIRED_BY_TYPE[type])
        : [],
    };
  }

  /** Linha Prisma → contrato da domain: Decimal→string, datas→ISO, sem FKs. */
  private toVersionContract(row: GroundWireVersionRow): GroundWireVersion {
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
      manufacturer: row.manufacturer ?? null,
      i2tKa2s: row.i2tKa2s?.toString() ?? null,
      fiberCount: row.fiberCount ?? null,
      effectiveFrom: row.effectiveFrom.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVersionFields(dto: GroundWireVersionFieldsDto) {
    return {
      description: dto.description ?? null,
      weightTonPerKm: dto.weightTonPerKm ?? null,
      reelLengthM: dto.reelLengthM ?? null,
      diameterMm: dto.diameterMm ?? null,
      utsKn: dto.utsKn ?? null,
      galvanizationClass: dto.galvanizationClass ?? null,
      strengthGrade: dto.strengthGrade ?? null,
      wireCount: dto.wireCount ?? null,
      manufacturer: dto.manufacturer ?? null,
      i2tKa2s: dto.i2tKa2s ?? null,
      fiberCount: dto.fiberCount ?? null,
    };
  }
}
