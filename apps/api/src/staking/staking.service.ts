import {
  AccessDifficulty,
  PaginatedStakingTowers,
  PlsCaddCommitPayload,
  PlsCaddImportPreview,
  PreliminaryPercentageItem,
  PreliminaryStakingDistributionItem,
  PreliminaryStakingDistributionPayload,
  StakingInvalidCombinationDetail,
  StakingPaginationQuery,
  StakingTowerInput,
  StakingTowerItem,
  StakingValidationSummary,
} from '@lt-offers/domain';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { BatchAssignStakingDto } from './dto/batch-assign-staking.dto';
import { PlsCaddParser } from './pls-cadd-parser';

const Decimal = Prisma.Decimal;

type StakingTowerWithRelations = Prisma.StakingTowerGetPayload<{
  include: {
    towerType: true;
    soilType: true;
    foundationType: true;
  };
}>;

@Injectable()
export class StakingService {
  constructor(private readonly prisma: PrismaService) {}

  private mapTowerToItem(t: StakingTowerWithRelations): StakingTowerItem {
    return {
      id: t.id,
      transmissionLineId: t.transmissionLineId,
      towerNumber: t.towerNumber,
      stationMeters: t.stationMeters.toFixed(2),
      bodyExtensionMeters: t.bodyExtensionMeters.toFixed(2),
      deflectionAngleDeg: t.deflectionAngleDeg.toFixed(2),
      lateralOffsetMeters: t.lateralOffsetMeters.toFixed(2),
      utmEast: t.utmEast ? t.utmEast.toFixed(2) : null,
      utmNorth: t.utmNorth ? t.utmNorth.toFixed(2) : null,
      elevationMeters: t.elevationMeters ? t.elevationMeters.toFixed(2) : null,
      towerTypeId: t.towerTypeId,
      soilTypeId: t.soilTypeId,
      foundationTypeId: t.foundationTypeId,
      accessDifficulty: t.accessDifficulty as AccessDifficulty,
      notes: t.notes,
      towerType: t.towerType
        ? {
            id: t.towerType.id,
            code: t.towerType.code,
            name: t.towerType.code,
          }
        : null,
      soilType: t.soilType
        ? {
            id: t.soilType.id,
            code: t.soilType.code,
            name: t.soilType.code,
          }
        : null,
      foundationType: t.foundationType
        ? {
            id: t.foundationType.id,
            code: t.foundationType.code,
            name: t.foundationType.code,
          }
        : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  private async ensureTransmissionLineExists(lineId: number) {
    const line = await this.prisma.transmissionLine.findUnique({
      where: { id: lineId },
    });
    if (!line) {
      throw new NotFoundException(
        `Linha de transmissão #${lineId} não encontrada.`,
      );
    }
    return line;
  }

  async getPaginatedTowers(
    lineId: number,
    query: StakingPaginationQuery,
  ): Promise<PaginatedStakingTowers> {
    await this.ensureTransmissionLineExists(lineId);

    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(1000, Math.max(1, query.pageSize || 50));
    const skip = (page - 1) * pageSize;

    const where: Prisma.StakingTowerWhereInput = {
      transmissionLineId: lineId,
    };

    if (query.search?.trim()) {
      where.towerNumber = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    if (query.towerTypeId !== undefined && query.towerTypeId !== null) {
      where.towerTypeId = query.towerTypeId;
    }

    if (query.soilTypeId !== undefined && query.soilTypeId !== null) {
      where.soilTypeId = query.soilTypeId;
    }

    if (
      query.foundationTypeId !== undefined &&
      query.foundationTypeId !== null
    ) {
      where.foundationTypeId = query.foundationTypeId;
    }

    if (query.accessDifficulty) {
      where.accessDifficulty = query.accessDifficulty;
    }

    if (
      query.minStationMeters !== undefined ||
      query.maxStationMeters !== undefined
    ) {
      where.stationMeters = {};
      if (query.minStationMeters !== undefined) {
        where.stationMeters.gte = new Decimal(query.minStationMeters);
      }
      if (query.maxStationMeters !== undefined) {
        where.stationMeters.lte = new Decimal(query.maxStationMeters);
      }
    }

    const orderBy: Prisma.StakingTowerOrderByWithRelationInput =
      query.sortBy === 'towerNumber'
        ? { towerNumber: query.sortDirection || 'asc' }
        : { stationMeters: query.sortDirection || 'asc' };

    const [items, totalCount, allTowersForSummary, matrices] =
      await Promise.all([
        this.prisma.stakingTower.findMany({
          where,
          include: {
            towerType: true,
            soilType: true,
            foundationType: true,
          },
          orderBy,
          skip,
          take: pageSize,
        }),
        this.prisma.stakingTower.count({ where }),
        this.prisma.stakingTower.findMany({
          where: { transmissionLineId: lineId },
          select: {
            stationMeters: true,
            soilTypeId: true,
            foundationTypeId: true,
          },
        }),
        this.prisma.foundationVolume.findMany({
          select: {
            soilTypeId: true,
            foundationTypeId: true,
          },
        }),
      ]);

    const matrixSet = new Set(
      matrices.map(
        (m: { soilTypeId: number; foundationTypeId: number }) =>
          `${m.soilTypeId}:${m.foundationTypeId}`,
      ),
    );

    let minStation = 0;
    let maxStation = 0;
    let unassignedSoilCount = 0;
    let unassignedFoundationCount = 0;
    let invalidCombinationsCount = 0;

    if (allTowersForSummary.length > 0) {
      minStation = Number(allTowersForSummary[0].stationMeters);
      maxStation = Number(allTowersForSummary[0].stationMeters);

      for (const t of allTowersForSummary) {
        const sm = Number(t.stationMeters);
        if (sm < minStation) minStation = sm;
        if (sm > maxStation) maxStation = sm;

        if (t.soilTypeId === null) {
          unassignedSoilCount++;
        }
        if (t.foundationTypeId === null) {
          unassignedFoundationCount++;
        }
        if (
          t.soilTypeId !== null &&
          t.foundationTypeId !== null &&
          !matrixSet.has(`${t.soilTypeId}:${t.foundationTypeId}`)
        ) {
          invalidCombinationsCount++;
        }
      }
    }

    return {
      items: items.map((t: StakingTowerWithRelations) =>
        this.mapTowerToItem(t),
      ),
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize) || 1,
      summary: {
        totalTowers: allTowersForSummary.length,
        minStationMeters: minStation.toFixed(2),
        maxStationMeters: maxStation.toFixed(2),
        unassignedSoilCount,
        unassignedFoundationCount,
        invalidCombinationsCount,
      },
    };
  }

  async getTowerById(
    lineId: number,
    towerId: number,
  ): Promise<StakingTowerItem> {
    const tower = await this.prisma.stakingTower.findFirst({
      where: { id: towerId, transmissionLineId: lineId },
      include: {
        towerType: true,
        soilType: true,
        foundationType: true,
      },
    });

    if (!tower) {
      throw new NotFoundException(
        `Torre #${towerId} não encontrada na linha de transmissão #${lineId}.`,
      );
    }

    return this.mapTowerToItem(tower);
  }

  async createTower(
    lineId: number,
    data: StakingTowerInput,
  ): Promise<StakingTowerItem> {
    await this.ensureTransmissionLineExists(lineId);

    const existing = await this.prisma.stakingTower.findUnique({
      where: {
        transmissionLineId_towerNumber: {
          transmissionLineId: lineId,
          towerNumber: data.towerNumber.trim(),
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Já existe uma torre com o identificador '${data.towerNumber}' nesta linha de transmissão.`,
      );
    }

    const created = await this.prisma.stakingTower.create({
      data: {
        transmissionLineId: lineId,
        towerNumber: data.towerNumber.trim(),
        stationMeters: new Decimal(data.stationMeters),
        bodyExtensionMeters: new Decimal(data.bodyExtensionMeters ?? 0),
        deflectionAngleDeg: new Decimal(data.deflectionAngleDeg ?? 0),
        lateralOffsetMeters: new Decimal(data.lateralOffsetMeters ?? 0),
        utmEast: data.utmEast ? new Decimal(data.utmEast) : null,
        utmNorth: data.utmNorth ? new Decimal(data.utmNorth) : null,
        elevationMeters: data.elevationMeters
          ? new Decimal(data.elevationMeters)
          : null,
        towerTypeId: data.towerTypeId ?? null,
        soilTypeId: data.soilTypeId ?? null,
        foundationTypeId: data.foundationTypeId ?? null,
        accessDifficulty: data.accessDifficulty ?? 'NORMAL',
        notes: data.notes?.trim() || null,
      },
      include: {
        towerType: true,
        soilType: true,
        foundationType: true,
      },
    });

    return this.mapTowerToItem(created);
  }

  async updateTower(
    lineId: number,
    towerId: number,
    data: Partial<StakingTowerInput>,
  ): Promise<StakingTowerItem> {
    const existing = await this.prisma.stakingTower.findFirst({
      where: { id: towerId, transmissionLineId: lineId },
    });

    if (!existing) {
      throw new NotFoundException(
        `Torre #${towerId} não encontrada na linha #${lineId}.`,
      );
    }

    if (data.towerNumber && data.towerNumber.trim() !== existing.towerNumber) {
      const duplicate = await this.prisma.stakingTower.findUnique({
        where: {
          transmissionLineId_towerNumber: {
            transmissionLineId: lineId,
            towerNumber: data.towerNumber.trim(),
          },
        },
      });
      if (duplicate) {
        throw new BadRequestException(
          `Já existe uma torre com o identificador '${data.towerNumber}' nesta linha.`,
        );
      }
    }

    const dataToUpdate: Prisma.StakingTowerUpdateInput = {};

    if (data.towerNumber !== undefined) {
      dataToUpdate.towerNumber = data.towerNumber.trim();
    }
    if (data.stationMeters !== undefined) {
      dataToUpdate.stationMeters = new Decimal(data.stationMeters);
    }
    if (data.bodyExtensionMeters !== undefined) {
      dataToUpdate.bodyExtensionMeters = new Decimal(data.bodyExtensionMeters);
    }
    if (data.deflectionAngleDeg !== undefined) {
      dataToUpdate.deflectionAngleDeg = new Decimal(data.deflectionAngleDeg);
    }
    if (data.lateralOffsetMeters !== undefined) {
      dataToUpdate.lateralOffsetMeters = new Decimal(data.lateralOffsetMeters);
    }
    if (data.utmEast !== undefined) {
      dataToUpdate.utmEast = data.utmEast ? new Decimal(data.utmEast) : null;
    }
    if (data.utmNorth !== undefined) {
      dataToUpdate.utmNorth = data.utmNorth ? new Decimal(data.utmNorth) : null;
    }
    if (data.elevationMeters !== undefined) {
      dataToUpdate.elevationMeters = data.elevationMeters
        ? new Decimal(data.elevationMeters)
        : null;
    }
    if (data.towerTypeId !== undefined) {
      dataToUpdate.towerType = data.towerTypeId
        ? { connect: { id: data.towerTypeId } }
        : { disconnect: true };
    }
    if (data.soilTypeId !== undefined) {
      dataToUpdate.soilType = data.soilTypeId
        ? { connect: { id: data.soilTypeId } }
        : { disconnect: true };
    }
    if (data.foundationTypeId !== undefined) {
      dataToUpdate.foundationType = data.foundationTypeId
        ? { connect: { id: data.foundationTypeId } }
        : { disconnect: true };
    }
    if (data.accessDifficulty !== undefined) {
      dataToUpdate.accessDifficulty = data.accessDifficulty;
    }
    if (data.notes !== undefined) {
      dataToUpdate.notes = data.notes?.trim() || null;
    }

    const updated = await this.prisma.stakingTower.update({
      where: { id: towerId },
      data: dataToUpdate,
      include: {
        towerType: true,
        soilType: true,
        foundationType: true,
      },
    });

    return this.mapTowerToItem(updated);
  }

  async deleteTower(lineId: number, towerId: number): Promise<void> {
    const existing = await this.prisma.stakingTower.findFirst({
      where: { id: towerId, transmissionLineId: lineId },
    });

    if (!existing) {
      throw new NotFoundException(
        `Torre #${towerId} não encontrada na linha #${lineId}.`,
      );
    }

    await this.prisma.stakingTower.delete({
      where: { id: towerId },
    });
  }

  async previewPlsCaddImport(
    lineId: number,
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<PlsCaddImportPreview> {
    const line = await this.ensureTransmissionLineExists(lineId);

    const parsedRows = PlsCaddParser.parse(fileBuffer);

    const existingTowers = await this.prisma.stakingTower.findMany({
      where: { transmissionLineId: lineId },
      select: {
        towerNumber: true,
        soilTypeId: true,
        foundationTypeId: true,
        notes: true,
      },
    });

    const existingTowerNumbers = new Set(
      existingTowers.map((t) => t.towerNumber.toUpperCase()),
    );
    const existingAssignmentsCount = existingTowers.filter(
      (t) =>
        t.soilTypeId !== null ||
        t.foundationTypeId !== null ||
        t.notes !== null,
    ).length;

    const refinedLengthKm = Number(line.refinedLengthKm);

    return PlsCaddParser.buildPreview(
      fileName,
      parsedRows,
      existingTowerNumbers,
      existingAssignmentsCount,
      refinedLengthKm,
    );
  }

  async commitPlsCaddImport(
    lineId: number,
    payload: PlsCaddCommitPayload,
  ): Promise<{
    importedCount: number;
    updatedCount: number;
    preservedCount: number;
  }> {
    await this.ensureTransmissionLineExists(lineId);

    if (!payload.rows || payload.rows.length === 0) {
      throw new BadRequestException('Nenhuma linha para importar.');
    }

    // Carregar catálogos para conversão de código -> ID se especificados
    const [towerTypes, soilTypes, foundationTypes, existingTowers] =
      await Promise.all([
        this.prisma.towerType.findMany({ select: { id: true, code: true } }),
        this.prisma.soilType.findMany({ select: { id: true, code: true } }),
        this.prisma.foundationType.findMany({
          select: { id: true, code: true },
        }),
        this.prisma.stakingTower.findMany({
          where: { transmissionLineId: lineId },
        }),
      ]);

    const towerTypeMap = new Map(
      towerTypes.map((t) => [t.code.toUpperCase(), t.id]),
    );
    const soilTypeMap = new Map(
      soilTypes.map((s) => [s.code.toUpperCase(), s.id]),
    );
    const foundationTypeMap = new Map(
      foundationTypes.map((f) => [f.code.toUpperCase(), f.id]),
    );
    const existingMap = new Map(
      existingTowers.map((t) => [t.towerNumber.toUpperCase(), t]),
    );

    let importedCount = 0;
    let updatedCount = 0;
    let preservedCount = 0;

    const incomingTowerNumbers = new Set<string>();

    await this.prisma.$transaction(
      async (tx) => {
        for (const row of payload.rows) {
          const upperNumber = row.towerNumber.trim().toUpperCase();
          incomingTowerNumbers.add(upperNumber);

          const existing = existingMap.get(upperNumber);

          const towerTypeIdFromCode = row.towerTypeCode
            ? (towerTypeMap.get(row.towerTypeCode.trim().toUpperCase()) ?? null)
            : null;
          const soilTypeIdFromCode = row.soilTypeCode
            ? (soilTypeMap.get(row.soilTypeCode.trim().toUpperCase()) ?? null)
            : null;
          const foundationTypeIdFromCode = row.foundationTypeCode
            ? (foundationTypeMap.get(
                row.foundationTypeCode.trim().toUpperCase(),
              ) ?? null)
            : null;

          if (existing) {
            // Atualizar preservando atribuições se configurado
            const shouldPreserve =
              payload.preserveExistingAssignments !== false;

            const finalTowerTypeId =
              towerTypeIdFromCode ??
              (shouldPreserve ? existing.towerTypeId : null);
            const finalSoilTypeId =
              soilTypeIdFromCode ??
              (shouldPreserve ? existing.soilTypeId : null);
            const finalFoundationTypeId =
              foundationTypeIdFromCode ??
              (shouldPreserve ? existing.foundationTypeId : null);

            if (
              shouldPreserve &&
              (existing.soilTypeId !== null ||
                existing.foundationTypeId !== null ||
                existing.notes !== null)
            ) {
              preservedCount++;
            }

            await tx.stakingTower.update({
              where: { id: existing.id },
              data: {
                towerNumber: row.towerNumber.trim(),
                stationMeters: new Decimal(row.stationMeters),
                bodyExtensionMeters: new Decimal(row.bodyExtensionMeters ?? 0),
                deflectionAngleDeg: new Decimal(row.deflectionAngleDeg ?? 0),
                lateralOffsetMeters: new Decimal(row.lateralOffsetMeters ?? 0),
                utmEast: row.utmEast ? new Decimal(row.utmEast) : null,
                utmNorth: row.utmNorth ? new Decimal(row.utmNorth) : null,
                elevationMeters: row.elevationMeters
                  ? new Decimal(row.elevationMeters)
                  : null,
                towerTypeId: finalTowerTypeId,
                soilTypeId: finalSoilTypeId,
                foundationTypeId: finalFoundationTypeId,
              },
            });

            updatedCount++;
          } else {
            // Inserir nova torre
            await tx.stakingTower.create({
              data: {
                transmissionLineId: lineId,
                towerNumber: row.towerNumber.trim(),
                stationMeters: new Decimal(row.stationMeters),
                bodyExtensionMeters: new Decimal(row.bodyExtensionMeters ?? 0),
                deflectionAngleDeg: new Decimal(row.deflectionAngleDeg ?? 0),
                lateralOffsetMeters: new Decimal(row.lateralOffsetMeters ?? 0),
                utmEast: row.utmEast ? new Decimal(row.utmEast) : null,
                utmNorth: row.utmNorth ? new Decimal(row.utmNorth) : null,
                elevationMeters: row.elevationMeters
                  ? new Decimal(row.elevationMeters)
                  : null,
                towerTypeId: towerTypeIdFromCode,
                soilTypeId: soilTypeIdFromCode,
                foundationTypeId: foundationTypeIdFromCode,
                accessDifficulty: 'NORMAL',
              },
            });

            importedCount++;
          }
        }

        // Remover torres que deixaram de existir no arquivo novo
        const toDeleteIds = existingTowers
          .filter((t) => !incomingTowerNumbers.has(t.towerNumber.toUpperCase()))
          .map((t) => t.id);

        if (toDeleteIds.length > 0) {
          await tx.stakingTower.deleteMany({
            where: { id: { in: toDeleteIds } },
          });
        }
      },
      { timeout: 30000 },
    );

    return { importedCount, updatedCount, preservedCount };
  }

  async batchAssign(
    lineId: number,
    payload: BatchAssignStakingDto,
  ): Promise<{ updatedCount: number }> {
    await this.ensureTransmissionLineExists(lineId);

    const where: Prisma.StakingTowerWhereInput = {
      transmissionLineId: lineId,
    };

    if (payload.towerIds && payload.towerIds.length > 0) {
      where.id = { in: payload.towerIds };
    }

    if (
      payload.startStationMeters !== undefined ||
      payload.endStationMeters !== undefined
    ) {
      where.stationMeters = {};
      if (payload.startStationMeters !== undefined) {
        where.stationMeters.gte = new Decimal(payload.startStationMeters);
      }
      if (payload.endStationMeters !== undefined) {
        where.stationMeters.lte = new Decimal(payload.endStationMeters);
      }
    }

    if (payload.towerTypeIdFilter !== undefined) {
      where.towerTypeId = payload.towerTypeIdFilter;
    }

    if (payload.soilTypeIdFilter !== undefined) {
      where.soilTypeId = payload.soilTypeIdFilter;
    }

    const data: Prisma.StakingTowerUncheckedUpdateManyInput = {};

    if (payload.assignTowerTypeId !== undefined) {
      data.towerTypeId = payload.assignTowerTypeId;
    }
    if (payload.assignSoilTypeId !== undefined) {
      data.soilTypeId = payload.assignSoilTypeId;
    }
    if (payload.assignFoundationTypeId !== undefined) {
      data.foundationTypeId = payload.assignFoundationTypeId;
    }
    if (payload.assignAccessDifficulty !== undefined) {
      data.accessDifficulty = payload.assignAccessDifficulty;
    }
    if (payload.assignNotes !== undefined) {
      data.notes = payload.assignNotes?.trim() || null;
    }

    const result = await this.prisma.stakingTower.updateMany({
      where,
      data,
    });

    return { updatedCount: result.count };
  }

  async getPreliminaryDistribution(
    lineId: number,
  ): Promise<PreliminaryStakingDistributionItem | null> {
    await this.ensureTransmissionLineExists(lineId);

    const dist = await this.prisma.preliminaryStakingDistribution.findUnique({
      where: { transmissionLineId: lineId },
    });

    if (!dist) {
      return null;
    }

    return {
      id: dist.id,
      transmissionLineId: dist.transmissionLineId,
      soilPercentages:
        dist.soilPercentages as unknown as PreliminaryPercentageItem[],
      foundationPercentages:
        dist.foundationPercentages as unknown as PreliminaryPercentageItem[],
      createdAt: dist.createdAt.toISOString(),
      updatedAt: dist.updatedAt.toISOString(),
    };
  }

  async savePreliminaryDistribution(
    lineId: number,
    payload: PreliminaryStakingDistributionPayload,
  ): Promise<PreliminaryStakingDistributionItem> {
    await this.ensureTransmissionLineExists(lineId);

    // Validação de soma 100,00%
    const soilSum = payload.soilPercentages.reduce(
      (acc, curr) => acc + Number(curr.percentage || 0),
      0,
    );
    if (Math.abs(soilSum - 100) > 0.01) {
      throw new BadRequestException(
        `A soma dos percentuais de tipo de solo deve totalizar 100,00%. Soma atual: ${soilSum.toFixed(2)}%`,
      );
    }

    const foundationSum = payload.foundationPercentages.reduce(
      (acc, curr) => acc + Number(curr.percentage || 0),
      0,
    );
    if (Math.abs(foundationSum - 100) > 0.01) {
      throw new BadRequestException(
        `A soma dos percentuais de tipo de fundação deve totalizar 100,00%. Soma atual: ${foundationSum.toFixed(2)}%`,
      );
    }

    const saved = await this.prisma.preliminaryStakingDistribution.upsert({
      where: { transmissionLineId: lineId },
      create: {
        transmissionLineId: lineId,
        soilPercentages:
          payload.soilPercentages as unknown as Prisma.InputJsonValue,
        foundationPercentages:
          payload.foundationPercentages as unknown as Prisma.InputJsonValue,
      },
      update: {
        soilPercentages:
          payload.soilPercentages as unknown as Prisma.InputJsonValue,
        foundationPercentages:
          payload.foundationPercentages as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      id: saved.id,
      transmissionLineId: saved.transmissionLineId,
      soilPercentages:
        saved.soilPercentages as unknown as PreliminaryPercentageItem[],
      foundationPercentages:
        saved.foundationPercentages as unknown as PreliminaryPercentageItem[],
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  async validateIntegrity(lineId: number): Promise<StakingValidationSummary> {
    const line = await this.ensureTransmissionLineExists(lineId);

    const [towers, matrices] = await Promise.all([
      this.prisma.stakingTower.findMany({
        where: { transmissionLineId: lineId },
        include: {
          soilType: true,
          foundationType: true,
        },
        orderBy: { stationMeters: 'asc' },
      }),
      this.prisma.foundationVolume.findMany({
        select: {
          soilTypeId: true,
          foundationTypeId: true,
        },
      }),
    ]);

    const matrixSet = new Set(
      matrices.map(
        (m: { soilTypeId: number; foundationTypeId: number }) =>
          `${m.soilTypeId}:${m.foundationTypeId}`,
      ),
    );

    let unassignedSoilCount = 0;
    let unassignedFoundationCount = 0;
    const invalidCombinations: StakingInvalidCombinationDetail[] = [];

    let maxStationMeters = 0;

    for (const t of towers) {
      const sm = Number(t.stationMeters);
      if (sm > maxStationMeters) {
        maxStationMeters = sm;
      }

      if (!t.soilTypeId) {
        unassignedSoilCount++;
      }
      if (!t.foundationTypeId) {
        unassignedFoundationCount++;
      }

      if (t.soilTypeId && t.foundationTypeId) {
        const key = `${t.soilTypeId}:${t.foundationTypeId}`;
        if (!matrixSet.has(key)) {
          invalidCombinations.push({
            towerNumber: t.towerNumber,
            stationMeters: t.stationMeters.toFixed(2),
            soilId: t.soilTypeId,
            soilCode: t.soilType?.code || '',
            soilName: t.soilType?.code || '',
            foundationId: t.foundationTypeId,
            foundationCode: t.foundationType?.code || '',
            foundationName: t.foundationType?.code || '',
            message: `A combinação de solo '${t.soilType?.code}' e fundação '${t.foundationType?.code}' não possui matriz de volumes cadastrada no catálogo.`,
          });
        }
      }
    }

    const totalStationLengthKm = (maxStationMeters / 1000).toFixed(3);
    const lineRefinedLengthKm = Number(line.refinedLengthKm).toFixed(3);

    let lengthDiscrepancyKm: string | null = null;
    const diff = Math.abs(
      maxStationMeters / 1000 - Number(line.refinedLengthKm),
    );
    if (diff > 0.05) {
      lengthDiscrepancyKm = diff.toFixed(3);
    }

    const hasErrors =
      unassignedSoilCount > 0 ||
      unassignedFoundationCount > 0 ||
      invalidCombinations.length > 0;

    return {
      hasErrors,
      totalTowers: towers.length,
      unassignedSoilCount,
      unassignedFoundationCount,
      invalidCombinationsCount: invalidCombinations.length,
      invalidCombinations,
      totalStationLengthKm,
      lineRefinedLengthKm,
      lengthDiscrepancyKm,
    };
  }
}
