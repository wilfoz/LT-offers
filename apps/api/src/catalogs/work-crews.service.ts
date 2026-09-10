import {
  WorkCrewHistory,
  WorkCrewSummary,
  WorkCrewVersion,
} from '@lt-offers/domain';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  Equipment as EquipmentRow,
  LaborRole as LaborRoleRow,
  WorkCrewEquipment as WorkCrewEquipmentRow,
  WorkCrewLaborRole as WorkCrewLaborRoleRow,
  WorkCrewVersion as WorkCrewVersionRow,
} from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from './civil-date';
import { CreateWorkCrewVersionDto } from './dto/create-work-crew-version.dto';
import { CreateWorkCrewDto } from './dto/create-work-crew.dto';
import { WorkCrewVersionFieldsDto } from './dto/work-crew-version-fields.dto';
import { missingFields, resolveEffectiveVersion } from './effectiveness';
import { isUniqueViolation } from './prisma-errors';

type LaborRoleWithParent = WorkCrewLaborRoleRow & {
  laborRole: LaborRoleRow;
};

type EquipmentWithParent = WorkCrewEquipmentRow & {
  equipment: EquipmentRow;
};

type VersionWithRelations = WorkCrewVersionRow & {
  laborRoles: LaborRoleWithParent[];
  equipments: EquipmentWithParent[];
};

const WORK_CREW_VERSION_INCLUDE = {
  laborRoles: {
    include: { laborRole: true },
    orderBy: { laborRoleId: 'asc' },
  },
  equipments: {
    include: { equipment: true },
    orderBy: { equipmentId: 'asc' },
  },
} as const;

const WORK_CREW_REQUIRED_LABELS = {
  standardProductionRate: 'taxa de produção',
  productionUnit: 'unidade de produção',
  productionPeriod: 'período de produção',
} as const;

const COMPOSITION_LABEL = 'composição de equipe';

@Injectable()
export class WorkCrewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateWorkCrewDto,
    createdBy: string,
    today: Date,
  ): Promise<WorkCrewSummary> {
    await this.validateResourceReferences(dto);
    const effectiveFrom = dto.effectiveFrom
      ? toCivilDate(dto.effectiveFrom)
      : today;

    try {
      const item = await this.prisma.workCrew.create({
        data: {
          code: dto.code,
          name: dto.name,
          versions: {
            create: {
              standardProductionRate: dto.standardProductionRate ?? null,
              productionUnit: dto.productionUnit ?? null,
              productionPeriod: dto.productionPeriod ?? null,
              effectiveFrom,
              createdBy,
              laborRoles: this.toLaborRolesCreate(dto),
              equipments: this.toEquipmentsCreate(dto),
            },
          },
        },
        include: { versions: { include: WORK_CREW_VERSION_INCLUDE } },
      });
      return this.toSummary(
        item.id,
        item.code,
        item.name,
        item.versions[0] as unknown as VersionWithRelations,
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
    dto: CreateWorkCrewVersionDto,
    createdBy: string,
  ): Promise<WorkCrewVersion> {
    await this.getItem(id);
    await this.validateResourceReferences(dto);
    const effectiveFrom = toCivilDate(dto.effectiveFrom);

    try {
      const version = await this.prisma.workCrewVersion.create({
        data: {
          workCrewId: id,
          standardProductionRate: dto.standardProductionRate ?? null,
          productionUnit: dto.productionUnit ?? null,
          productionPeriod: dto.productionPeriod ?? null,
          effectiveFrom,
          createdBy,
          laborRoles: this.toLaborRolesCreate(dto),
          equipments: this.toEquipmentsCreate(dto),
        },
        include: WORK_CREW_VERSION_INCLUDE,
      });
      return this.toVersionContract(version as unknown as VersionWithRelations);
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
  ): Promise<WorkCrewSummary[]> {
    const filter: Prisma.WorkCrewWhereInput = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const items = await this.prisma.workCrew.findMany({
      where: filter,
      include: { versions: { include: WORK_CREW_VERSION_INCLUDE } },
      orderBy: { code: 'asc' },
    });

    return items.map((item) => {
      const effective = resolveEffectiveVersion(
        item.versions as unknown as VersionWithRelations[],
        referenceDate,
      );
      return this.toSummary(item.id, item.code, item.name, effective);
    });
  }

  async get(id: number, referenceDate: Date): Promise<WorkCrewSummary> {
    const item = await this.getItem(id);
    const effective = resolveEffectiveVersion(
      item.versions as unknown as VersionWithRelations[],
      referenceDate,
    );
    if (!effective) {
      throw new NotFoundException(
        'Não há versão vigente para a data de referência informada',
      );
    }
    return this.toSummary(item.id, item.code, item.name, effective);
  }

  async listHistory(id: number): Promise<WorkCrewHistory> {
    const item = await this.getItem(id);
    const versions = [...(item.versions as unknown as VersionWithRelations[])]
      .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
      .map((version) => this.toVersionContract(version));
    return { id: item.id, code: item.code, name: item.name, versions };
  }

  private async getItem(id: number) {
    const item = await this.prisma.workCrew.findUnique({
      where: { id },
      include: { versions: { include: WORK_CREW_VERSION_INCLUDE } },
    });
    if (!item) {
      throw new NotFoundException('Equipe de trabalho não encontrada');
    }
    return item;
  }

  private async validateResourceReferences(dto: WorkCrewVersionFieldsDto) {
    if (dto.laborRoles?.length) {
      const roleIds = dto.laborRoles.map((r) => r.laborRoleId);
      const existingRoles = await this.prisma.laborRole.findMany({
        where: { id: { in: roleIds } },
        select: { id: true },
      });
      const existingRoleIds = new Set(existingRoles.map((r) => r.id));
      for (const id of roleIds) {
        if (!existingRoleIds.has(id)) {
          throw new BadRequestException(
            `Cargo de mão de obra com identificador ${id} não encontrado no catálogo`,
          );
        }
      }
    }

    if (dto.equipments?.length) {
      const equipmentIds = dto.equipments.map((e) => e.equipmentId);
      const existingEquipments = await this.prisma.equipment.findMany({
        where: { id: { in: equipmentIds } },
        select: { id: true },
      });
      const existingEquipmentIds = new Set(existingEquipments.map((e) => e.id));
      for (const id of equipmentIds) {
        if (!existingEquipmentIds.has(id)) {
          throw new BadRequestException(
            `Equipamento com identificador ${id} não encontrado no catálogo`,
          );
        }
      }
    }
  }

  private toSummary(
    id: number,
    code: string,
    name: string,
    row: VersionWithRelations | undefined,
  ): WorkCrewSummary {
    const effective = row ? this.toVersionContract(row) : null;
    const pendingFields = effective
      ? missingFields(effective, WORK_CREW_REQUIRED_LABELS)
      : [];
    if (
      effective &&
      effective.laborRoles.length === 0 &&
      effective.equipments.length === 0
    ) {
      pendingFields.push(COMPOSITION_LABEL);
    }
    return {
      id,
      code,
      name,
      laborRoleCount: effective ? effective.laborRoles.length : 0,
      equipmentCount: effective ? effective.equipments.length : 0,
      effectiveVersion: effective,
      pendingFields,
    };
  }

  private toVersionContract(row: VersionWithRelations): WorkCrewVersion {
    return {
      id: row.id,
      standardProductionRate: row.standardProductionRate?.toString() ?? null,
      productionUnit: row.productionUnit ?? null,
      productionPeriod: row.productionPeriod,
      effectiveFrom: row.effectiveFrom.toISOString(),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      laborRoles: row.laborRoles.map((lr) => ({
        laborRoleId: lr.laborRoleId,
        laborRoleCode: lr.laborRole?.code,
        laborRoleName: lr.laborRole?.name,
        quantity: lr.quantity.toString(),
      })),
      equipments: row.equipments.map((eq) => ({
        equipmentId: eq.equipmentId,
        equipmentCode: eq.equipment?.code,
        equipmentDescription: eq.equipment?.description,
        quantity: eq.quantity.toString(),
      })),
    };
  }

  private toLaborRolesCreate(dto: WorkCrewVersionFieldsDto) {
    if (!dto.laborRoles?.length) {
      return undefined;
    }
    return {
      create: dto.laborRoles.map((item) => ({
        laborRoleId: item.laborRoleId,
        quantity: item.quantity,
      })),
    };
  }

  private toEquipmentsCreate(dto: WorkCrewVersionFieldsDto) {
    if (!dto.equipments?.length) {
      return undefined;
    }
    return {
      create: dto.equipments.map((item) => ({
        equipmentId: item.equipmentId,
        quantity: item.quantity,
      })),
    };
  }
}
