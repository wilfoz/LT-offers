import {
  LaborRoleHistory,
  LaborRoleSummary,
  LaborRoleVersion,
} from '@lt-offers/domain';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { LaborRoleVersion as LaborRoleVersionRow } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from './civil-date';
import { CreateLaborRoleDto } from './dto/create-labor-role.dto';
import { CreateLaborRoleVersionDto } from './dto/create-labor-role-version.dto';
import { LaborRoleVersionFieldsDto } from './dto/labor-role-version-fields.dto';
import { missingFields, resolveEffectiveVersion } from './effectiveness';
import { isUniqueViolation } from './prisma-errors';

// Rótulos exibidos ao usuário — permanecem em pt-BR (RNF-14). Obrigatórios
// para pendência (RF-11, spec catalogos/mao-de-obra): salário base e encargos.
const LABOR_ROLE_REQUIRED_LABELS = {
  baseSalary: 'salário base (R$)',
  socialChargesPercent: 'encargos sociais (%)',
} as const;

@Injectable()
export class LaborRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateLaborRoleDto,
    createdBy: string,
    today: Date,
  ): Promise<LaborRoleSummary> {
    const effectiveFrom = dto.effectiveFrom
      ? toCivilDate(dto.effectiveFrom)
      : today;

    try {
      const item = await this.prisma.laborRole.create({
        data: {
          code: dto.code,
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
      return this.toSummary(item.id, item.code, item.name, item.versions[0]);
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
    dto: CreateLaborRoleVersionDto,
    createdBy: string,
  ): Promise<LaborRoleVersion> {
    await this.getItem(id);
    const effectiveFrom = toCivilDate(dto.effectiveFrom);

    try {
      const version = await this.prisma.laborRoleVersion.create({
        data: {
          laborRoleId: id,
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
  ): Promise<LaborRoleSummary[]> {
    const filter: Prisma.LaborRoleWhereInput = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const items = await this.prisma.laborRole.findMany({
      where: filter,
      include: { versions: true },
      orderBy: { code: 'asc' },
    });

    return items.map((item) => {
      const effective = resolveEffectiveVersion(item.versions, referenceDate);
      return this.toSummary(item.id, item.code, item.name, effective);
    });
  }

  async get(id: number, referenceDate: Date): Promise<LaborRoleSummary> {
    const item = await this.getItem(id);
    const effective = resolveEffectiveVersion(item.versions, referenceDate);
    if (!effective) {
      throw new NotFoundException(
        'Não há versão vigente para a data de referência informada',
      );
    }
    return this.toSummary(item.id, item.code, item.name, effective);
  }

  async listHistory(id: number): Promise<LaborRoleHistory> {
    const item = await this.getItem(id);
    const versions = [...item.versions]
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
      .map((version) => this.toVersionContract(version));
    return { id: item.id, code: item.code, name: item.name, versions };
  }

  private async getItem(id: number) {
    const item = await this.prisma.laborRole.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!item) {
      throw new NotFoundException('Cargo não encontrado');
    }
    return item;
  }

  private toSummary(
    id: number,
    code: string,
    name: string,
    row: LaborRoleVersionRow | undefined,
  ): LaborRoleSummary {
    const effective = row ? this.toVersionContract(row) : null;
    const pending: string[] = [];
    if (!name?.trim()) {
      pending.push('nome');
    }
    if (effective) {
      pending.push(...missingFields(effective, LABOR_ROLE_REQUIRED_LABELS));
    }
    return {
      id,
      code,
      name,
      effectiveVersion: effective,
      pendingFields: pending,
    };
  }

  /** Linha Prisma → contrato da domain: Decimal→string, datas→ISO, sem FKs. */
  private toVersionContract(row: LaborRoleVersionRow): LaborRoleVersion {
    return {
      id: row.id,
      baseSalary: row.baseSalary?.toString() ?? null,
      hazardPayPercent: row.hazardPayPercent?.toString() ?? null,
      overtimePercent: row.overtimePercent?.toString() ?? null,
      dsrOvertimePercent: row.dsrOvertimePercent?.toString() ?? null,
      socialChargesPercent: row.socialChargesPercent?.toString() ?? null,
      foodAllowanceMonthly: row.foodAllowanceMonthly?.toString() ?? null,
      housingMonthly: row.housingMonthly?.toString() ?? null,
      homeLeaveTravelMonthly: row.homeLeaveTravelMonthly?.toString() ?? null,
      healthInsuranceMonthly: row.healthInsuranceMonthly?.toString() ?? null,
      lifeInsuranceMonthly: row.lifeInsuranceMonthly?.toString() ?? null,
      effectiveFrom: row.effectiveFrom.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toVersionFields(dto: LaborRoleVersionFieldsDto) {
    return {
      baseSalary: dto.baseSalary ?? null,
      hazardPayPercent: dto.hazardPayPercent ?? null,
      overtimePercent: dto.overtimePercent ?? null,
      dsrOvertimePercent: dto.dsrOvertimePercent ?? null,
      socialChargesPercent: dto.socialChargesPercent ?? null,
      foodAllowanceMonthly: dto.foodAllowanceMonthly ?? null,
      housingMonthly: dto.housingMonthly ?? null,
      homeLeaveTravelMonthly: dto.homeLeaveTravelMonthly ?? null,
      healthInsuranceMonthly: dto.healthInsuranceMonthly ?? null,
      lifeInsuranceMonthly: dto.lifeInsuranceMonthly ?? null,
    };
  }
}
