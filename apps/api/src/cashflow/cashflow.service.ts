import { Injectable, NotFoundException } from '@nestjs/common';
import { CashflowSummary } from '@lt-offers/domain';
import {
  CashflowCalculator,
  CashflowCalculationInput,
  DisbursementItemInput,
} from '@lt-offers/calc-engine';
import { PrismaService } from '../app/prisma.service';

@Injectable()
export class CashflowService {
  constructor(private readonly prisma: PrismaService) {}

  async getLineCashflow(
    lineId: number,
    params?: { advanceRate?: number; retentionRate?: number; billingLag?: number }
  ): Promise<CashflowSummary> {
    const line = await this.prisma.transmissionLine.findUnique({
      where: { id: lineId },
      include: {
        offerRevision: {
          include: {
            offer: true,
          },
        },
      },
    });

    if (!line) {
      throw new NotFoundException(`Linha de transmissão ID ${lineId} não encontrada.`);
    }

    const lengthKm = Number(line.refinedLengthKm || line.reportLengthKm || 100);
    const totalTowers = Math.max(1, Math.round(lengthKm * 2.5));

    const totalMaterialsCost = lengthKm * 125000 * 1.3425 + totalTowers * 45000 * 1.3425;
    const totalServicesCost = lengthKm * 55000 * 1.0925 + totalTowers * 27500 * 1.0925;
    const totalIndirectsCost = lengthKm * 18000;
    const totalCost = totalMaterialsCost + totalServicesCost + totalIndirectsCost;
    const totalSalePrice = totalCost * 1.3063; // BDI 30.63%

    const totalMonths = 18;

    const disbursements: DisbursementItemInput[] = [
      {
        itemId: `mat-disb-${lineId}`,
        itemCode: 'MAT_TOTAL',
        description: 'Materiais Principais (Cabos, Torres, Isoladores)',
        type: 'MATERIALS',
        totalCost: totalMaterialsCost.toFixed(2),
        monthlyCostPercentages: {
          4: 10,
          5: 20,
          6: 25,
          7: 20,
          8: 15,
          9: 10,
        },
      },
      {
        itemId: `srv-disb-${lineId}`,
        itemCode: 'SRV_TOTAL',
        description: 'Serviços de Obras Civis, Montagem e Lançamento',
        type: 'SERVICES',
        totalCost: totalServicesCost.toFixed(2),
        monthlyCostPercentages: {
          3: 5,
          4: 10,
          5: 15,
          6: 15,
          7: 15,
          8: 15,
          9: 10,
          10: 10,
          11: 5,
        },
      },
      {
        itemId: `ind-disb-${lineId}`,
        itemCode: 'IND_TOTAL',
        description: 'Canteiros e Indiretos de Projeto',
        type: 'INDIRECTS',
        totalCost: totalIndirectsCost.toFixed(2),
        monthlyCostPercentages: {
          1: 15,
          2: 5,
          3: 5,
          4: 5,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
          13: 5,
          14: 5,
          15: 5,
          16: 5,
          17: 5,
          18: 5,
        },
      },
    ];

    const physicalProgress: Record<number, number> = {
      1: 0,
      2: 0,
      3: 5,
      4: 10,
      5: 15,
      6: 15,
      7: 15,
      8: 15,
      9: 10,
      10: 10,
      11: 5,
    };

    const input: CashflowCalculationInput = {
      offerId: String(line.offerRevision.offerId),
      lineId: String(lineId),
      lineName: line.name || `Linha de Transmissão ${lineId}`,
      totalMonths,
      totalSalePrice: totalSalePrice.toFixed(2),
      advancePaymentRate: params?.advanceRate !== undefined ? params.advanceRate : 10,
      retentionRate: params?.retentionRate !== undefined ? params.retentionRate : 5,
      billingLagMonths: params?.billingLag !== undefined ? params.billingLag : 1,
      disbursements,
      monthlyPhysicalProgressPercentages: physicalProgress,
      supplyDeliveries: [
        {
          materialGroup: 'Cabos Condutores Alumínio (t)',
          month: 6,
          tonsOrUnits: '450 t',
          percentage: '50%',
          estimatedCost: (totalMaterialsCost * 0.25).toFixed(2),
        },
        {
          materialGroup: 'Cabos Condutores Alumínio (t)',
          month: 7,
          tonsOrUnits: '450 t',
          percentage: '50%',
          estimatedCost: (totalMaterialsCost * 0.25).toFixed(2),
        },
        {
          materialGroup: 'Estruturas Metálicas / Torres (t)',
          month: 5,
          tonsOrUnits: '600 t',
          percentage: '50%',
          estimatedCost: (totalMaterialsCost * 0.25).toFixed(2),
        },
        {
          materialGroup: 'Estruturas Metálicas / Torres (t)',
          month: 6,
          tonsOrUnits: '600 t',
          percentage: '50%',
          estimatedCost: (totalMaterialsCost * 0.25).toFixed(2),
        },
      ],
    };

    return CashflowCalculator.calculateCashflow(input);
  }

  async getConsolidatedCashflow(
    offerId: number,
    params?: { advanceRate?: number; retentionRate?: number; billingLag?: number }
  ): Promise<CashflowSummary> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        revisions: {
          include: {
            transmissionLines: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException(`Oferta ID ${offerId} não encontrada.`);
    }

    const latestRevision = offer.revisions && offer.revisions.length > 0
      ? offer.revisions[offer.revisions.length - 1]
      : null;
    const lines: Array<{ id: number }> = (latestRevision && (latestRevision as any).transmissionLines) || [];

    if (lines.length === 0) {
      return this.getLineCashflow(1, params);
    }

    const lineCashflows = await Promise.all(
      lines.map((l: { id: number }) => this.getLineCashflow(l.id, params))
    );

    const totalMonths = lineCashflows[0].totalMonths;
    const consolidatedPoints = [];

    let accumOutflow = 0;
    let accumInflow = 0;
    let accumCashflow = 0;
    let maxNegExp = 0;
    let peakMonth = 1;

    for (let m = 1; m <= totalMonths; m++) {
      let matOut = 0;
      let srvOut = 0;
      let indOut = 0;
      let totalOut = 0;
      let measBill = 0;
      let advBill = 0;
      let totalIn = 0;

      for (const lc of lineCashflows) {
        const pt = lc.monthlyPoints[m - 1];
        if (pt) {
          matOut += Number(pt.materialsOutflow);
          srvOut += Number(pt.servicesOutflow);
          indOut += Number(pt.indirectsOutflow);
          totalOut += Number(pt.totalOutflow);
          measBill += Number(pt.measurementBilling);
          advBill += Number(pt.advanceBilling);
          totalIn += Number(pt.totalInflow);
        }
      }

      accumOutflow += totalOut;
      accumInflow += totalIn;
      const netMonth = totalIn - totalOut;
      accumCashflow += netMonth;

      if (accumCashflow < 0) {
        const absExp = Math.abs(accumCashflow);
        if (absExp > maxNegExp) {
          maxNegExp = absExp;
          peakMonth = m;
        }
      }

      consolidatedPoints.push({
        month: m,
        materialsOutflow: matOut.toFixed(2),
        servicesOutflow: srvOut.toFixed(2),
        indirectsOutflow: indOut.toFixed(2),
        totalOutflow: totalOut.toFixed(2),
        accumulatedOutflow: accumOutflow.toFixed(2),
        measurementBilling: measBill.toFixed(2),
        advanceBilling: advBill.toFixed(2),
        totalInflow: totalIn.toFixed(2),
        accumulatedInflow: accumInflow.toFixed(2),
        netMonthlyCashflow: netMonth.toFixed(2),
        accumulatedCashflow: accumCashflow.toFixed(2),
      });
    }

    return {
      offerId: String(offerId),
      lineName: `Fluxo de Caixa Consolidado (${lines.length} LTs)`,
      totalMonths,
      monthlyPoints: consolidatedPoints,
      totalOutflow: accumOutflow.toFixed(2),
      totalInflow: accumInflow.toFixed(2),
      finalAccumulatedBalance: accumCashflow.toFixed(2),
      financialExposure: {
        peakMonth,
        maxNegativeExposure: maxNegExp.toFixed(2),
        recommendedWorkingCapital: (maxNegExp * 1.1).toFixed(2),
      },
      supplyDeliverySchedule: lineCashflows[0].supplyDeliverySchedule,
    };
  }
}
