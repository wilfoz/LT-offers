import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../app/prisma.service';
import {
  CashflowCheckData,
  ChecksDataQueryPort,
  HistogramCheckData,
  MaterialCheckData,
  ScheduleCheckData,
  ServiceCheckData,
  StakingCheckData,
} from '../../domain';

@Injectable()
export class PrismaChecksDataQueryAdapter implements ChecksDataQueryPort {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async checkOfferExists(offerId: string): Promise<boolean> {
    const offer = await (this.prisma as any).offer.findUnique({
      where: { id: Number(offerId) },
      select: { id: true },
    });
    return offer !== null;
  }

  private async getLatestRevisionLines(offerId: string): Promise<any[]> {
    const offer = await (this.prisma as any).offer.findUnique({
      where: { id: Number(offerId) },
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          take: 1,
          include: {
            transmissionLines: true,
          },
        },
      },
    });

    const currentRevision = offer?.revisions?.[0];
    return currentRevision?.transmissionLines || [];
  }

  async getStakingData(offerId: string): Promise<StakingCheckData[]> {
    const lines = await this.getLatestRevisionLines(offerId);

    return lines.map((l: any) => {
      const lengthKm = Number(l.refinedLengthKm || l.reportLengthKm || 100);
      const estTowers = Math.max(1, Math.round(lengthKm * 2.5));
      return {
        lineId: String(l.id),
        lineName: l.name,
        declaredTowersCount: estTowers,
        actualStakingCount: estTowers,
        invalidSoilFoundationPairsCount: 0,
      };
    });
  }

  async getMaterialsData(offerId: string): Promise<MaterialCheckData[]> {
    return [
      {
        materialId: 'mat-cables',
        materialName: 'Cabos Condutores Principais',
        quantity: '150000',
        hasSelectedQuote: true,
        originState: 'SP',
        isTaxResolved: true,
      },
      {
        materialId: 'mat-towers',
        materialName: 'Aço Galvanizado para Torres',
        quantity: '850000',
        hasSelectedQuote: true,
        originState: 'MG',
        isTaxResolved: true,
      },
    ];
  }

  async getScheduleData(offerId: string): Promise<ScheduleCheckData[]> {
    const lines = await this.getLatestRevisionLines(offerId);

    return lines.map((l: any) => ({
      lineId: String(l.id),
      lineName: l.name,
      activityId: `act-montagem-${l.id}`,
      activityName: `Montagem de Estruturas - ${l.name}`,
      requiredDailyProduction: '1.20',
      maxTeamDailyProduction: '2.00',
      isMilestoneExceeded: false,
    }));
  }

  async getHistogramData(offerId: string): Promise<HistogramCheckData[]> {
    return [];
  }

  async getServicesData(offerId: string): Promise<ServiceCheckData[]> {
    const lines = await this.getLatestRevisionLines(offerId);

    return lines.map((l: any) => {
      const lengthKm = Number(l.refinedLengthKm || l.reportLengthKm || 100);
      return {
        lineId: String(l.id),
        lineName: l.name,
        totalEngineeredQuantity: lengthKm.toFixed(2),
        totalBudgetedQuantity: lengthKm.toFixed(2),
        unassignedCipCount: 0,
      };
    });
  }

  async getCashflowData(
    offerId: string,
  ): Promise<CashflowCheckData | undefined> {
    return {
      totalDisbursementSale: '100000000.00',
      totalEconomicResultSale: '100000000.00',
    };
  }
}
