import { Inject, Injectable } from '@nestjs/common';
import { CashflowSummary } from '@lt-offers/domain';
import {
  CashflowCalculator,
  CashflowCalculationInput,
  DisbursementItemInput,
} from '@lt-offers/calc-engine';
import {
  CashflowQueryParams,
  ECONOMICS_DATA_QUERY_PORT_TOKEN,
  EconomicsDataQueryPort,
  EconomicsLineNotFoundException,
} from '../../domain';

@Injectable()
export class GetLineCashflowUseCase {
  constructor(
    @Inject(ECONOMICS_DATA_QUERY_PORT_TOKEN)
    private readonly economicsData: EconomicsDataQueryPort,
  ) {}

  /**
   * Fluxo de desembolso e faturamento da linha (M11): curvas mensais
   * paramétricas delegadas ao CashflowCalculator.
   */
  async execute(
    lineId: number,
    params?: CashflowQueryParams,
  ): Promise<CashflowSummary> {
    const line = await this.economicsData.findLineEconomicsData(lineId);

    if (!line) {
      throw new EconomicsLineNotFoundException(lineId);
    }

    const lengthKm = Number(line.refinedLengthKm || line.reportLengthKm || 100);
    const totalTowers = Math.max(1, Math.round(lengthKm * 2.5));

    const totalMaterialsCost =
      lengthKm * 125000 * 1.3425 + totalTowers * 45000 * 1.3425;
    const totalServicesCost =
      lengthKm * 55000 * 1.0925 + totalTowers * 27500 * 1.0925;
    const totalIndirectsCost = lengthKm * 18000;
    const totalCost =
      totalMaterialsCost + totalServicesCost + totalIndirectsCost;
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
      offerId: String(line.offerId),
      lineId: String(lineId),
      lineName: line.name || `Linha de Transmissão ${lineId}`,
      totalMonths,
      totalSalePrice: totalSalePrice.toFixed(2),
      advancePaymentRate:
        params?.advanceRate !== undefined ? params.advanceRate : 10,
      retentionRate:
        params?.retentionRate !== undefined ? params.retentionRate : 5,
      billingLagMonths:
        params?.billingLag !== undefined ? params.billingLag : 1,
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
}
