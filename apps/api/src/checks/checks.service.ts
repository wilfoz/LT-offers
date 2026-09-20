import { Injectable, NotFoundException } from '@nestjs/common';
import { OfferHealthSummary } from '@lt-offers/domain';
import {
  ConsistencyEngine,
  ConsistencyEngineInput,
} from '@lt-offers/calc-engine';
import { PrismaService } from '../app/prisma.service';

@Injectable()
export class ChecksService {
  constructor(private readonly prisma: PrismaService) {}

  async runOfferChecks(offerId: number): Promise<OfferHealthSummary> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
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

    if (!offer) {
      throw new NotFoundException(`Oferta #${offerId} não encontrada.`);
    }

    const currentRevision = offer.revisions[0];
    const lines = currentRevision?.transmissionLines || [];

    // Monta o input para o ConsistencyEngine
    const stakingLines = lines.map((l) => {
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

    const materials = [
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

    const scheduleActivities = lines.map((l) => ({
      lineId: String(l.id),
      lineName: l.name,
      activityId: `act-montagem-${l.id}`,
      activityName: `Montagem de Estruturas - ${l.name}`,
      requiredDailyProduction: '1.20',
      maxTeamDailyProduction: '2.00',
      isMilestoneExceeded: false,
    }));

    const services = lines.map((l) => {
      const lengthKm = Number(l.refinedLengthKm || l.reportLengthKm || 100);
      return {
        lineId: String(l.id),
        lineName: l.name,
        totalEngineeredQuantity: lengthKm.toFixed(2),
        totalBudgetedQuantity: lengthKm.toFixed(2),
        unassignedCipCount: 0,
      };
    });

    const input: ConsistencyEngineInput = {
      offerId: String(offerId),
      stakingLines,
      materials,
      scheduleActivities,
      histogramDeficits: [],
      services,
      cashflow: {
        totalDisbursementSale: '100000000.00',
        totalEconomicResultSale: '100000000.00',
      },
    };

    return ConsistencyEngine.evaluate(input);
  }
}
