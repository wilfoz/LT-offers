import {
  CashflowSummary,
  CashflowMonthPoint,
  FinancialExposurePeak,
  SupplyDeliverySchedulePoint,
  DisbursementItemType,
} from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';

export interface DisbursementItemInput {
  itemId: string;
  itemCode?: string;
  description?: string;
  type: DisbursementItemType;
  totalCost: number | string;
  monthlyCostPercentages: Record<number, number | string>;
}

export interface CashflowCalculationInput {
  offerId: string;
  lineId?: string;
  lineName?: string;
  totalMonths: number;
  totalSalePrice: number | string;
  advancePaymentRate?: number | string;
  retentionRate?: number | string;
  billingLagMonths?: number;
  disbursements: DisbursementItemInput[];
  monthlyPhysicalProgressPercentages?: Record<number, number | string>;
  supplyDeliveries?: SupplyDeliverySchedulePoint[];
}

export class CashflowCalculator {
  /**
   * Calcula a distribuição temporal de desembolsos, fluxo de caixa e pico de exposição (RF-57..RF-60).
   */
  static calculateCashflow(input: CashflowCalculationInput): CashflowSummary {
    const totalMonths = Math.max(1, input.totalMonths || 18);
    const totalSalePriceDec = DecimalValue.of(input.totalSalePrice || '0');
    const advanceRateDec = DecimalValue.of(input.advancePaymentRate || '0');
    const retentionRateDec = DecimalValue.of(input.retentionRate || '0');
    const billingLag =
      input.billingLagMonths !== undefined ? input.billingLagMonths : 1;

    const monthlyPoints: CashflowMonthPoint[] = [];

    let runningAccumOutflow = DecimalValue.zero();
    let runningAccumInflow = DecimalValue.zero();
    let runningAccumCashflow = DecimalValue.zero();

    let maxNegativeExp = DecimalValue.zero();
    let peakExpMonth = 1;

    // Pré-computa desembolsos mensais por tipo
    const monthlyMaterials: Record<number, DecimalValue> = {};
    const monthlyServices: Record<number, DecimalValue> = {};
    const monthlyIndirects: Record<number, DecimalValue> = {};

    for (let m = 1; m <= totalMonths; m++) {
      monthlyMaterials[m] = DecimalValue.zero();
      monthlyServices[m] = DecimalValue.zero();
      monthlyIndirects[m] = DecimalValue.zero();
    }

    for (const item of input.disbursements) {
      const itemTotalCost = DecimalValue.of(item.totalCost || '0');
      for (let m = 1; m <= totalMonths; m++) {
        const pctRaw = item.monthlyCostPercentages?.[m] || '0';
        const pctDec = DecimalValue.of(pctRaw).dividedBy(
          DecimalValue.of('100'),
        );
        const monthCost = itemTotalCost.times(pctDec);

        if (item.type === 'MATERIALS') {
          monthlyMaterials[m] = monthlyMaterials[m].plus(monthCost);
        } else if (item.type === 'SERVICES') {
          monthlyServices[m] = monthlyServices[m].plus(monthCost);
        } else {
          monthlyIndirects[m] = monthlyIndirects[m].plus(monthCost);
        }
      }
    }

    // Faturamento inicial por Adiantamento (Mês 1)
    const advanceAmountDec = totalSalePriceDec
      .times(advanceRateDec.dividedBy(DecimalValue.of('100')))
      .round(2, 'half-up');

    // Valor faturável por medição física (descontado do adiantamento)
    const netBillableByMeasurement = totalSalePriceDec.minus(advanceAmountDec);

    for (let m = 1; m <= totalMonths; m++) {
      const matOut = monthlyMaterials[m].round(2, 'half-up');
      const srvOut = monthlyServices[m].round(2, 'half-up');
      const indOut = monthlyIndirects[m].round(2, 'half-up');
      const monthTotalOutflow = matOut.plus(srvOut).plus(indOut);

      runningAccumOutflow = runningAccumOutflow.plus(monthTotalOutflow);

      // Entradas (Faturamento)
      let advanceBillingDec = DecimalValue.zero();
      if (m === 1 && !advanceAmountDec.isZero()) {
        advanceBillingDec = advanceAmountDec;
      }

      let measurementBillingDec = DecimalValue.zero();
      // Medição associada ao progresso físico com defasagem de faturamento
      const progressMonth = m - billingLag;
      if (progressMonth >= 1 && progressMonth <= totalMonths) {
        const progPctRaw =
          input.monthlyPhysicalProgressPercentages?.[progressMonth] || '0';
        const progPctDec = DecimalValue.of(progPctRaw).dividedBy(
          DecimalValue.of('100'),
        );
        // Aplica desconto de retenção técnica
        const retentionMult = DecimalValue.of('1').minus(
          retentionRateDec.dividedBy(DecimalValue.of('100')),
        );
        measurementBillingDec = netBillableByMeasurement
          .times(progPctDec)
          .times(retentionMult)
          .round(2, 'half-up');
      }

      // No último mês, liquida medições residuais devido a defasagem (lag) e libera a retenção técnica
      if (m === totalMonths) {
        if (billingLag > 0) {
          for (
            let lagM = totalMonths - billingLag + 1;
            lagM <= totalMonths;
            lagM++
          ) {
            const progPctRaw =
              input.monthlyPhysicalProgressPercentages?.[lagM] || '0';
            const progPctDec = DecimalValue.of(progPctRaw).dividedBy(
              DecimalValue.of('100'),
            );
            const retentionMult = DecimalValue.of('1').minus(
              retentionRateDec.dividedBy(DecimalValue.of('100')),
            );
            measurementBillingDec = measurementBillingDec.plus(
              netBillableByMeasurement
                .times(progPctDec)
                .times(retentionMult)
                .round(2, 'half-up'),
            );
          }
        }
        if (!retentionRateDec.isZero()) {
          const totalRetentionDec = netBillableByMeasurement
            .times(retentionRateDec.dividedBy(DecimalValue.of('100')))
            .round(2, 'half-up');
          measurementBillingDec = measurementBillingDec.plus(totalRetentionDec);
        }
      }

      const monthTotalInflow = advanceBillingDec.plus(measurementBillingDec);
      runningAccumInflow = runningAccumInflow.plus(monthTotalInflow);

      const netMonthly = monthTotalInflow.minus(monthTotalOutflow);
      runningAccumCashflow = runningAccumCashflow.plus(netMonthly);

      // Verifica pico de exposição negativa
      if (runningAccumCashflow.isNegative()) {
        const absExp = runningAccumCashflow.abs();
        if (absExp.greaterThan(maxNegativeExp)) {
          maxNegativeExp = absExp;
          peakExpMonth = m;
        }
      }

      monthlyPoints.push({
        month: m,
        materialsOutflow: matOut.toFixed(2),
        servicesOutflow: srvOut.toFixed(2),
        indirectsOutflow: indOut.toFixed(2),
        totalOutflow: monthTotalOutflow.toFixed(2),
        accumulatedOutflow: runningAccumOutflow.toFixed(2),
        measurementBilling: measurementBillingDec.toFixed(2),
        advanceBilling: advanceBillingDec.toFixed(2),
        totalInflow: monthTotalInflow.toFixed(2),
        accumulatedInflow: runningAccumInflow.toFixed(2),
        netMonthlyCashflow: netMonthly.toFixed(2),
        accumulatedCashflow: runningAccumCashflow.toFixed(2),
      });
    }

    const recommendedCapital = maxNegativeExp
      .times(DecimalValue.of('1.10'))
      .round(2, 'half-up');

    const exposure: FinancialExposurePeak = {
      peakMonth: peakExpMonth,
      maxNegativeExposure: maxNegativeExp.toFixed(2),
      recommendedWorkingCapital: recommendedCapital.toFixed(2),
    };

    return {
      offerId: input.offerId,
      lineId: input.lineId,
      lineName: input.lineName,
      totalMonths,
      monthlyPoints,
      totalOutflow: runningAccumOutflow.toFixed(2),
      totalInflow: runningAccumInflow.toFixed(2),
      finalAccumulatedBalance: runningAccumCashflow.toFixed(2),
      financialExposure: exposure,
      supplyDeliverySchedule: input.supplyDeliveries,
    };
  }
}
