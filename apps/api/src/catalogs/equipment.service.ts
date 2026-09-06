import {
  EquipmentHistory,
  EquipmentSummary,
  EquipmentVersion,
} from '@lt-offers/domain';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { EquipmentVersion as EquipmentVersionRow } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from './civil-date';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { CreateEquipmentVersionDto } from './dto/create-equipment-version.dto';
import { EquipmentVersionFieldsDto } from './dto/equipment-version-fields.dto';
import { resolveEffectiveVersion } from './effectiveness';
import { isUniqueViolation } from './prisma-errors';

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateEquipmentDto,
    createdBy: string,
    today: Date,
  ): Promise<EquipmentSummary> {
    const effectiveFrom = dto.effectiveFrom
      ? toCivilDate(dto.effectiveFrom)
      : today;

    try {
      const item = await this.prisma.equipment.create({
        data: {
          code: dto.code,
          description: dto.description,
          category: dto.category ?? null,
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
        item.category,
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
    dto: CreateEquipmentVersionDto,
    createdBy: string,
  ): Promise<EquipmentVersion> {
    await this.getItem(id);
    const effectiveFrom = toCivilDate(dto.effectiveFrom);

    try {
      const version = await this.prisma.equipmentVersion.create({
        data: {
          equipmentId: id,
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
  ): Promise<EquipmentSummary[]> {
    const where: Prisma.EquipmentWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    const items = await this.prisma.equipment.findMany({
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
        item.category,
        effective,
      );
    });
  }

  async get(id: number, referenceDate: Date): Promise<EquipmentSummary> {
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
      item.category,
      effective,
    );
  }

  async listHistory(id: number): Promise<EquipmentHistory> {
    const item = await this.getItem(id);
    const versions = [...item.versions]
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
      .map((version) => this.toVersionContract(version));
    return {
      id: item.id,
      code: item.code,
      description: item.description,
      category: item.category,
      versions,
    };
  }

  private async getItem(id: number) {
    const item = await this.prisma.equipment.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!item) {
      throw new NotFoundException('Equipamento não encontrado');
    }
    return item;
  }

  private toSummary(
    id: number,
    code: string,
    description: string,
    category: string | null,
    row: EquipmentVersionRow | undefined,
  ): EquipmentSummary {
    const effective = row ? this.toVersionContract(row) : null;
    const pending: string[] = [];

    if (!description?.trim()) {
      pending.push('descrição');
    }

    if (effective) {
      const hasExternal = effective.externalRentalMonthly !== null;
      const hasInternal = effective.internalRentalMonthly !== null;
      const hasPurchase =
        effective.purchasePrice !== null &&
        effective.depreciationYears !== null;

      if (!hasExternal && !hasInternal && !hasPurchase) {
        pending.push('nenhuma estratégia de custo informada');
      }
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
  private toVersionContract(row: EquipmentVersionRow): EquipmentVersion {
    return {
      id: row.id,
      externalRentalMonthly: row.externalRentalMonthly?.toString() ?? null,
      internalRentalMonthly: row.internalRentalMonthly?.toString() ?? null,
      purchasePrice: row.purchasePrice?.toString() ?? null,
      depreciationYears: row.depreciationYears ?? null,
      ownedAvailabilityCount: row.ownedAvailabilityCount ?? null,
      fuelMaintenanceMonthly: row.fuelMaintenanceMonthly?.toString() ?? null,
      effectiveFrom: row.effectiveFrom.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVersionFields(dto: EquipmentVersionFieldsDto) {
    return {
      externalRentalMonthly: dto.externalRentalMonthly ?? null,
      internalRentalMonthly: dto.internalRentalMonthly ?? null,
      purchasePrice: dto.purchasePrice ?? null,
      depreciationYears: dto.depreciationYears ?? null,
      ownedAvailabilityCount: dto.ownedAvailabilityCount ?? null,
      fuelMaintenanceMonthly: dto.fuelMaintenanceMonthly ?? null,
    };
  }
}
