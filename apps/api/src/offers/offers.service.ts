import {
  CANONICAL_SCOPE_ITEMS,
  CloneOfferPayload,
  CreateNewRevisionPayload,
  CreateOfferPayload,
  OfferDetail,
  OfferRevisionItem,
  OfferRevisionStatus,
  OfferSummary,
  ScopeMatrixItemPayload,
  TransmissionLineItem,
  UpdateOfferGeneralPayload,
  UpdateOfferRevisionPayload,
} from '@lt-offers/domain';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { toCivilDate } from '../catalogs/civil-date';
import { isUniqueViolation } from '../catalogs/prisma-errors';

const Decimal = Prisma.Decimal;

type OfferWithRevisionsAndLines = Prisma.OfferGetPayload<{
  include: {
    revisions: {
      include: {
        transmissionLines: true;
        scopeMatrixItems: true;
      };
    };
  };
}>;

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(search?: string): Promise<OfferSummary[]> {
    const trimmed = search?.trim();
    const where = trimmed
      ? {
          OR: [
            { code: { contains: trimmed, mode: 'insensitive' as const } },
            { name: { contains: trimmed, mode: 'insensitive' as const } },
            { clientName: { contains: trimmed, mode: 'insensitive' as const } },
            {
              revisions: {
                some: {
                  OR: [
                    {
                      auctionName: {
                        contains: trimmed,
                        mode: 'insensitive' as const,
                      },
                    },
                    {
                      lotName: {
                        contains: trimmed,
                        mode: 'insensitive' as const,
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {};

    const offers = await this.prisma.offer.findMany({
      where,
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          take: 1,
          include: {
            transmissionLines: true,
            scopeMatrixItems: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return offers.map((offer) => {
      const currentRev = offer.revisions[0];
      const lines = currentRev?.transmissionLines ?? [];
      const lineCount = lines.length;

      let totalKm = new Decimal(0);
      let hasInvalidAllocation = false;

      for (const line of lines) {
        totalKm = totalKm.plus(line.reportLengthKm);
        const p1 = line.destinationPercentagePrimary;
        const p2 = line.destinationPercentageSecondary ?? new Decimal(0);
        if (!p1.plus(p2).equals(100)) {
          hasInvalidAllocation = true;
        }
      }

      const hasPendingIssues =
        !currentRev ||
        lineCount === 0 ||
        hasInvalidAllocation ||
        (currentRev.scopeMatrixItems?.length ?? 0) === 0;

      return {
        id: offer.id,
        code: offer.code,
        name: offer.name,
        clientName: offer.clientName,
        baseCurrency: offer.baseCurrency,
        clonedFromOfferId: offer.clonedFromOfferId,
        currentRevisionNumber: currentRev ? currentRev.revisionNumber : 0,
        currentRevisionStatus: currentRev
          ? (currentRev.status as OfferRevisionStatus)
          : 'DRAFT',
        auctionName: currentRev?.auctionName ?? '—',
        lotName: currentRev?.lotName ?? '—',
        lineCount,
        totalLengthKm: totalKm.toFixed(3),
        hasPendingIssues,
        createdBy: offer.createdBy,
        createdAt: offer.createdAt.toISOString(),
        updatedAt: offer.updatedAt.toISOString(),
      };
    });
  }

  async getById(id: number): Promise<OfferDetail> {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          include: {
            transmissionLines: {
              orderBy: { code: 'asc' },
            },
            scopeMatrixItems: {
              orderBy: { itemCode: 'asc' },
            },
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException(`Oferta #${id} não encontrada`);
    }

    return this.mapToDetail(offer);
  }

  async getByCode(code: string): Promise<OfferDetail> {
    const offer = await this.prisma.offer.findUnique({
      where: { code },
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          include: {
            transmissionLines: {
              orderBy: { code: 'asc' },
            },
            scopeMatrixItems: {
              orderBy: { itemCode: 'asc' },
            },
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException(`Oferta com código "${code}" não encontrada`);
    }

    return this.mapToDetail(offer);
  }

  async create(payload: CreateOfferPayload): Promise<OfferDetail> {
    const code = payload.code.trim();
    if (!code) {
      throw new BadRequestException('O código da oferta é obrigatório');
    }

    const lines = payload.transmissionLines ?? [];
    this.validateLines(lines);

    const offerDate = toCivilDate(payload.offerDate);
    const auctionDate = payload.auctionDate
      ? toCivilDate(payload.auctionDate)
      : null;
    const scheduleStartDate = payload.scheduleStartDate
      ? toCivilDate(payload.scheduleStartDate)
      : null;
    const commercialOperationDate = payload.commercialOperationDate
      ? toCivilDate(payload.commercialOperationDate)
      : null;

    const initialScopeItems =
      payload.scopeMatrixItems && payload.scopeMatrixItems.length > 0
        ? payload.scopeMatrixItems
        : CANONICAL_SCOPE_ITEMS.map((item) => ({
            itemCode: item.itemCode,
            itemName: item.itemName,
            category: item.category,
            responsibleParty: item.responsibleParty,
            acceptsDirectBilling: item.acceptsDirectBilling,
            currencyRiskParty: item.currencyRiskParty,
            commodityRiskParty: item.commodityRiskParty,
            notes: null,
          }));

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const offer = await tx.offer.create({
          data: {
            code,
            name: payload.name.trim(),
            clientName: payload.clientName.trim(),
            baseCurrency: payload.baseCurrency?.trim() || 'BRL',
            createdBy: payload.createdBy?.trim() || 'system',
          },
        });

        const revision = await tx.offerRevision.create({
          data: {
            offerId: offer.id,
            revisionNumber: 0,
            status: 'DRAFT',
            auctionName: payload.auctionName.trim(),
            lotName: payload.lotName.trim(),
            offerDate,
            auctionDate,
            scheduleStartDate,
            commercialOperationDate,
            estimatedCapex: payload.estimatedCapex
              ? new Decimal(payload.estimatedCapex)
              : null,
            maxRap: payload.maxRap ? new Decimal(payload.maxRap) : null,
            winningRap: payload.winningRap
              ? new Decimal(payload.winningRap)
              : null,
            notes: payload.notes?.trim() || null,
            createdBy: payload.createdBy?.trim() || 'system',
          },
        });

        if (lines.length > 0) {
          await tx.transmissionLine.createMany({
            data: lines.map((l) => ({
              offerRevisionId: revision.id,
              code: l.code.trim(),
              name: l.name.trim(),
              nominalVoltageKv: new Decimal(l.nominalVoltageKv),
              refinedLengthKm: new Decimal(l.refinedLengthKm),
              reportLengthKm: new Decimal(l.reportLengthKm),
              circuitCount: l.circuitCount,
              bundleConductorCount: l.bundleConductorCount,
              destinationStatePrimary: l.destinationStatePrimary
                .trim()
                .toUpperCase(),
              destinationPercentagePrimary: new Decimal(
                l.destinationPercentagePrimary,
              ),
              destinationStateSecondary:
                l.destinationStateSecondary?.trim().toUpperCase() || null,
              destinationPercentageSecondary: l.destinationPercentageSecondary
                ? new Decimal(l.destinationPercentageSecondary)
                : null,
            })),
          });
        }

        if (initialScopeItems.length > 0) {
          await tx.scopeMatrixItem.createMany({
            data: initialScopeItems.map((s) => ({
              offerRevisionId: revision.id,
              itemCode: s.itemCode.trim(),
              itemName: s.itemName.trim(),
              category: s.category.trim(),
              responsibleParty: s.responsibleParty,
              acceptsDirectBilling: s.acceptsDirectBilling,
              currencyRiskParty: s.currencyRiskParty,
              commodityRiskParty: s.commodityRiskParty,
              notes: s.notes?.trim() || null,
            })),
          });
        }

        return tx.offer.findUniqueOrThrow({
          where: { id: offer.id },
          include: {
            revisions: {
              include: {
                transmissionLines: true,
                scopeMatrixItems: true,
              },
            },
          },
        });
      });

      return this.mapToDetail(created);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new BadRequestException(
          `Já existe uma oferta cadastrada com o código "${code}"`,
        );
      }
      throw error;
    }
  }

  async updateGeneral(
    id: number,
    payload: UpdateOfferGeneralPayload,
  ): Promise<OfferDetail> {
    await this.getById(id);

    await this.prisma.offer.update({
      where: { id },
      data: {
        name:
          payload.name?.trim() !== undefined ? payload.name.trim() : undefined,
        clientName:
          payload.clientName?.trim() !== undefined
            ? payload.clientName.trim()
            : undefined,
        baseCurrency:
          payload.baseCurrency?.trim() !== undefined
            ? payload.baseCurrency.trim()
            : undefined,
      },
    });

    return this.getById(id);
  }

  async updateRevision(
    offerId: number,
    revisionId: number,
    payload: UpdateOfferRevisionPayload,
  ): Promise<OfferDetail> {
    const revision = await this.prisma.offerRevision.findFirst({
      where: { id: revisionId, offerId },
      include: { transmissionLines: true, scopeMatrixItems: true },
    });

    if (!revision) {
      throw new NotFoundException(
        `Revisão #${revisionId} não encontrada para a oferta #${offerId}`,
      );
    }

    const isClosed =
      revision.status === 'FROZEN' || revision.status === 'DELIVERED';
    const isStatusOnlyTransition =
      payload.status !== undefined && Object.keys(payload).length === 1;

    if (isClosed && !isStatusOnlyTransition) {
      throw new BadRequestException(
        'Revisões fechadas ou entregues são imutáveis; crie uma nova revisão para realizar alterações.',
      );
    }

    if (payload.status === 'FROZEN' || payload.status === 'DELIVERED') {
      const lines = revision.transmissionLines;
      if (!lines || lines.length === 0) {
        throw new BadRequestException(
          'Não é possível fechar ou congelar uma revisão sem linhas de transmissão cadastradas (RF-63).',
        );
      }
    }

    if (payload.transmissionLines) {
      this.validateLines(payload.transmissionLines);
    }

    await this.prisma.$transaction(async (tx) => {
      const dataToUpdate: Prisma.OfferRevisionUpdateInput = {};
      if (payload.auctionName !== undefined)
        dataToUpdate.auctionName = payload.auctionName.trim();
      if (payload.lotName !== undefined)
        dataToUpdate.lotName = payload.lotName.trim();
      if (payload.offerDate !== undefined)
        dataToUpdate.offerDate = toCivilDate(payload.offerDate);
      if (payload.auctionDate !== undefined) {
        dataToUpdate.auctionDate = payload.auctionDate
          ? toCivilDate(payload.auctionDate)
          : null;
      }
      if (payload.scheduleStartDate !== undefined) {
        dataToUpdate.scheduleStartDate = payload.scheduleStartDate
          ? toCivilDate(payload.scheduleStartDate)
          : null;
      }
      if (payload.commercialOperationDate !== undefined) {
        dataToUpdate.commercialOperationDate = payload.commercialOperationDate
          ? toCivilDate(payload.commercialOperationDate)
          : null;
      }
      if (payload.estimatedCapex !== undefined) {
        dataToUpdate.estimatedCapex = payload.estimatedCapex
          ? new Decimal(payload.estimatedCapex)
          : null;
      }
      if (payload.maxRap !== undefined) {
        dataToUpdate.maxRap = payload.maxRap
          ? new Decimal(payload.maxRap)
          : null;
      }
      if (payload.winningRap !== undefined) {
        dataToUpdate.winningRap = payload.winningRap
          ? new Decimal(payload.winningRap)
          : null;
      }
      if (payload.notes !== undefined) {
        dataToUpdate.notes = payload.notes?.trim() || null;
      }
      if (payload.status !== undefined) {
        dataToUpdate.status = payload.status;
        if (payload.status === 'FROZEN' && !revision.closedAt) {
          dataToUpdate.closedAt = new Date();
        } else if (payload.status === 'DELIVERED' && !revision.deliveredAt) {
          dataToUpdate.deliveredAt = new Date();
        }
      }

      await tx.offerRevision.update({
        where: { id: revisionId },
        data: dataToUpdate,
      });

      if (payload.transmissionLines !== undefined) {
        await tx.transmissionLine.deleteMany({
          where: { offerRevisionId: revisionId },
        });

        if (payload.transmissionLines.length > 0) {
          await tx.transmissionLine.createMany({
            data: payload.transmissionLines.map((l) => ({
              offerRevisionId: revisionId,
              code: l.code.trim(),
              name: l.name.trim(),
              nominalVoltageKv: new Decimal(l.nominalVoltageKv),
              refinedLengthKm: new Decimal(l.refinedLengthKm),
              reportLengthKm: new Decimal(l.reportLengthKm),
              circuitCount: l.circuitCount,
              bundleConductorCount: l.bundleConductorCount,
              destinationStatePrimary: l.destinationStatePrimary
                .trim()
                .toUpperCase(),
              destinationPercentagePrimary: new Decimal(
                l.destinationPercentagePrimary,
              ),
              destinationStateSecondary:
                l.destinationStateSecondary?.trim().toUpperCase() || null,
              destinationPercentageSecondary: l.destinationPercentageSecondary
                ? new Decimal(l.destinationPercentageSecondary)
                : null,
            })),
          });
        }
      }

      if (payload.scopeMatrixItems !== undefined) {
        await tx.scopeMatrixItem.deleteMany({
          where: { offerRevisionId: revisionId },
        });

        if (payload.scopeMatrixItems.length > 0) {
          await tx.scopeMatrixItem.createMany({
            data: payload.scopeMatrixItems.map((s) => ({
              offerRevisionId: revisionId,
              itemCode: s.itemCode.trim(),
              itemName: s.itemName.trim(),
              category: s.category.trim(),
              responsibleParty: s.responsibleParty,
              acceptsDirectBilling: s.acceptsDirectBilling,
              currencyRiskParty: s.currencyRiskParty,
              commodityRiskParty: s.commodityRiskParty,
              notes: s.notes?.trim() || null,
            })),
          });
        }
      }
    });

    return this.getById(offerId);
  }

  async createNewRevision(
    offerId: number,
    payload: CreateNewRevisionPayload,
  ): Promise<OfferDetail> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          take: 1,
          include: { transmissionLines: true, scopeMatrixItems: true },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException(`Oferta #${offerId} não encontrada`);
    }

    const latestRevision = offer.revisions[0];
    const nextRevisionNumber = latestRevision
      ? latestRevision.revisionNumber + 1
      : 0;

    await this.prisma.$transaction(async (tx) => {
      const newRev = await tx.offerRevision.create({
        data: {
          offerId,
          revisionNumber: nextRevisionNumber,
          status: 'DRAFT',
          auctionName: latestRevision?.auctionName ?? 'Leilão',
          lotName: latestRevision?.lotName ?? 'Lote',
          offerDate: latestRevision?.offerDate ?? new Date(),
          auctionDate: latestRevision?.auctionDate,
          scheduleStartDate: latestRevision?.scheduleStartDate,
          commercialOperationDate: latestRevision?.commercialOperationDate,
          estimatedCapex: latestRevision?.estimatedCapex,
          maxRap: latestRevision?.maxRap,
          winningRap: latestRevision?.winningRap,
          notes:
            payload.notes?.trim() ||
            `Revisão R${nextRevisionNumber} criada a partir de R${latestRevision?.revisionNumber ?? 0}`,
          createdBy: payload.createdBy?.trim() || 'system',
        },
      });

      if (latestRevision?.transmissionLines.length) {
        await tx.transmissionLine.createMany({
          data: latestRevision.transmissionLines.map((l) => ({
            offerRevisionId: newRev.id,
            code: l.code,
            name: l.name,
            nominalVoltageKv: l.nominalVoltageKv,
            refinedLengthKm: l.refinedLengthKm,
            reportLengthKm: l.reportLengthKm,
            circuitCount: l.circuitCount,
            bundleConductorCount: l.bundleConductorCount,
            destinationStatePrimary: l.destinationStatePrimary,
            destinationPercentagePrimary: l.destinationPercentagePrimary,
            destinationStateSecondary: l.destinationStateSecondary,
            destinationPercentageSecondary: l.destinationPercentageSecondary,
          })),
        });
      }

      if (latestRevision?.scopeMatrixItems.length) {
        await tx.scopeMatrixItem.createMany({
          data: latestRevision.scopeMatrixItems.map((s) => ({
            offerRevisionId: newRev.id,
            itemCode: s.itemCode,
            itemName: s.itemName,
            category: s.category,
            responsibleParty: s.responsibleParty,
            acceptsDirectBilling: s.acceptsDirectBilling,
            currencyRiskParty: s.currencyRiskParty,
            commodityRiskParty: s.commodityRiskParty,
            notes: s.notes,
          })),
        });
      }
    });

    return this.getById(offerId);
  }

  async cloneOffer(
    sourceId: number,
    payload: CloneOfferPayload,
  ): Promise<OfferDetail> {
    const sourceOffer = await this.prisma.offer.findUnique({
      where: { id: sourceId },
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          take: 1,
          include: { transmissionLines: true, scopeMatrixItems: true },
        },
      },
    });

    if (!sourceOffer) {
      throw new NotFoundException(
        `Oferta de origem #${sourceId} não encontrada`,
      );
    }

    const latestRevision = sourceOffer.revisions[0];
    const targetCode = payload.targetCode.trim();

    try {
      const cloned = await this.prisma.$transaction(async (tx) => {
        const newOffer = await tx.offer.create({
          data: {
            code: targetCode,
            name: payload.targetName.trim(),
            clientName: sourceOffer.clientName,
            baseCurrency: sourceOffer.baseCurrency,
            clonedFromOfferId: sourceOffer.id,
            createdBy: payload.createdBy?.trim() || 'system',
          },
        });

        const newRevision = await tx.offerRevision.create({
          data: {
            offerId: newOffer.id,
            revisionNumber: 0,
            status: 'DRAFT',
            auctionName:
              payload.targetAuctionName?.trim() ||
              latestRevision?.auctionName ||
              'Leilão',
            lotName:
              payload.targetLotName?.trim() ||
              latestRevision?.lotName ||
              'Lote',
            offerDate: latestRevision?.offerDate ?? new Date(),
            auctionDate: latestRevision?.auctionDate,
            scheduleStartDate: latestRevision?.scheduleStartDate,
            commercialOperationDate: latestRevision?.commercialOperationDate,
            estimatedCapex: latestRevision?.estimatedCapex,
            maxRap: latestRevision?.maxRap,
            winningRap: latestRevision?.winningRap,
            notes: `Clonado a partir de ${sourceOffer.code} (R${latestRevision?.revisionNumber ?? 0})`,
            createdBy: payload.createdBy?.trim() || 'system',
          },
        });

        if (latestRevision?.transmissionLines.length) {
          await tx.transmissionLine.createMany({
            data: latestRevision.transmissionLines.map((l) => ({
              offerRevisionId: newRevision.id,
              code: l.code,
              name: l.name,
              nominalVoltageKv: l.nominalVoltageKv,
              refinedLengthKm: l.refinedLengthKm,
              reportLengthKm: l.reportLengthKm,
              circuitCount: l.circuitCount,
              bundleConductorCount: l.bundleConductorCount,
              destinationStatePrimary: l.destinationStatePrimary,
              destinationPercentagePrimary: l.destinationPercentagePrimary,
              destinationStateSecondary: l.destinationStateSecondary,
              destinationPercentageSecondary: l.destinationPercentageSecondary,
            })),
          });
        }

        if (latestRevision?.scopeMatrixItems.length) {
          await tx.scopeMatrixItem.createMany({
            data: latestRevision.scopeMatrixItems.map((s) => ({
              offerRevisionId: newRevision.id,
              itemCode: s.itemCode,
              itemName: s.itemName,
              category: s.category,
              responsibleParty: s.responsibleParty,
              acceptsDirectBilling: s.acceptsDirectBilling,
              currencyRiskParty: s.currencyRiskParty,
              commodityRiskParty: s.commodityRiskParty,
              notes: s.notes,
            })),
          });
        }

        return tx.offer.findUniqueOrThrow({
          where: { id: newOffer.id },
          include: {
            revisions: {
              include: {
                transmissionLines: true,
                scopeMatrixItems: true,
              },
            },
          },
        });
      });

      return this.mapToDetail(cloned);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new BadRequestException(
          `Já existe uma oferta com o código "${targetCode}"`,
        );
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
    });

    if (!offer) {
      throw new NotFoundException(`Oferta #${id} não encontrada`);
    }

    await this.prisma.offer.delete({
      where: { id },
    });
  }

  private validateLines(lines: TransmissionLineItem[]): void {
    const codes = new Set<string>();
    for (const line of lines) {
      const code = line.code.trim();
      if (codes.has(code)) {
        throw new BadRequestException(
          `Código de linha duplicado na oferta: "${code}"`,
        );
      }
      codes.add(code);

      const p1 = new Decimal(line.destinationPercentagePrimary);
      const p2 = line.destinationPercentageSecondary
        ? new Decimal(line.destinationPercentageSecondary)
        : new Decimal(0);
      const sum = p1.plus(p2);

      if (!sum.equals(100)) {
        throw new BadRequestException(
          `Rateio territorial inválido para a linha "${code}": a soma dos percentuais das UFs deve ser exatamente 100% (atual: ${sum.toFixed(2)}%)`,
        );
      }
    }
  }

  private mapToDetail(offer: OfferWithRevisionsAndLines): OfferDetail {
    return {
      id: offer.id,
      code: offer.code,
      name: offer.name,
      clientName: offer.clientName,
      baseCurrency: offer.baseCurrency,
      clonedFromOfferId: offer.clonedFromOfferId,
      createdBy: offer.createdBy,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
      revisions: (offer.revisions || []).map((rev): OfferRevisionItem => ({
        id: rev.id,
        offerId: rev.offerId,
        revisionNumber: rev.revisionNumber,
        status: rev.status,
        auctionName: rev.auctionName,
        lotName: rev.lotName,
        offerDate: rev.offerDate.toISOString().slice(0, 10),
        auctionDate: rev.auctionDate
          ? rev.auctionDate.toISOString().slice(0, 10)
          : null,
        scheduleStartDate: rev.scheduleStartDate
          ? rev.scheduleStartDate.toISOString().slice(0, 10)
          : null,
        commercialOperationDate: rev.commercialOperationDate
          ? rev.commercialOperationDate.toISOString().slice(0, 10)
          : null,
        estimatedCapex: rev.estimatedCapex
          ? rev.estimatedCapex.toFixed(2)
          : null,
        maxRap: rev.maxRap ? rev.maxRap.toFixed(2) : null,
        winningRap: rev.winningRap ? rev.winningRap.toFixed(2) : null,
        notes: rev.notes,
        closedAt: rev.closedAt ? rev.closedAt.toISOString() : null,
        deliveredAt: rev.deliveredAt ? rev.deliveredAt.toISOString() : null,
        createdBy: rev.createdBy ?? 'system',
        createdAt: rev.createdAt
          ? rev.createdAt.toISOString()
          : new Date().toISOString(),
        updatedAt: rev.updatedAt
          ? rev.updatedAt.toISOString()
          : new Date().toISOString(),
        transmissionLines: (rev.transmissionLines || []).map(
          (l): TransmissionLineItem => ({
            id: l.id,
            code: l.code,
            name: l.name,
            nominalVoltageKv: l.nominalVoltageKv.toFixed(2),
            refinedLengthKm: l.refinedLengthKm.toFixed(3),
            reportLengthKm: l.reportLengthKm.toFixed(3),
            circuitCount: l.circuitCount,
            bundleConductorCount: l.bundleConductorCount,
            destinationStatePrimary: l.destinationStatePrimary,
            destinationPercentagePrimary:
              l.destinationPercentagePrimary.toFixed(2),
            destinationStateSecondary: l.destinationStateSecondary,
            destinationPercentageSecondary: l.destinationPercentageSecondary
              ? l.destinationPercentageSecondary.toFixed(2)
              : null,
          }),
        ),
        scopeMatrixItems: (rev.scopeMatrixItems || []).map(
          (s): ScopeMatrixItemPayload => ({
            id: s.id,
            itemCode: s.itemCode,
            itemName: s.itemName,
            category: s.category,
            responsibleParty: s.responsibleParty,
            acceptsDirectBilling: s.acceptsDirectBilling,
            currencyRiskParty: s.currencyRiskParty,
            commodityRiskParty: s.commodityRiskParty,
            notes: s.notes,
          }),
        ),
      })),
    };
  }
}
