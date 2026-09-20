import { Inject, Injectable } from '@nestjs/common';
import { CashflowSummary } from '@lt-offers/domain';
import {
  CashflowQueryParams,
  ECONOMICS_DATA_QUERY_PORT_TOKEN,
  EconomicsDataQueryPort,
  EconomicsOfferNotFoundException,
} from '../../domain';
import { GetLineCashflowUseCase } from './get-line-cashflow.usecase';

@Injectable()
export class GetConsolidatedCashflowUseCase {
  constructor(
    @Inject(ECONOMICS_DATA_QUERY_PORT_TOKEN)
    private readonly economicsData: EconomicsDataQueryPort,
    private readonly getLineCashflow: GetLineCashflowUseCase,
  ) {}

  /**
   * Fluxo de caixa consolidado da oferta: soma mês a mês dos fluxos das
   * linhas da última revisão, com exposição financeira recalculada.
   */
  async execute(
    offerId: number,
    params?: CashflowQueryParams,
  ): Promise<CashflowSummary> {
    const lineIds = await this.economicsData.findOfferLineIds(offerId);

    if (lineIds === null) {
      throw new EconomicsOfferNotFoundException(offerId);
    }

    if (lineIds.length === 0) {
      return this.getLineCashflow.execute(1, params);
    }

    const lineCashflows = await Promise.all(
      lineIds.map((id) => this.getLineCashflow.execute(id, params)),
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
      lineName: `Fluxo de Caixa Consolidado (${lineIds.length} LTs)`,
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
