import {
  CurveSData,
  CurveSStatusSummary,
  EarnedValueMetrics,
  MonthlyProgressRecord,
  WorkBaseline,
} from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';

export interface PlannedMonthlyScheduleItem {
  monthNumber: number;
  periodDate: string; // YYYY-MM
  plannedMonthlyAmount: string; // R$ no mês
  plannedCumulativeAmount: string; // PV acumulado (R$)
  plannedCumulativeProgressPercent: string; // % acumulado planejado
}

export class EarnedValueCalculator {
  /**
   * Calcula as métricas de Earned Value (EVM) para um único período de corte.
   */
  static calculatePeriodMetrics(params: {
    monthNumber: number;
    periodDate: string;
    plannedValue: string; // PV acumulado
    earnedValue: string; // EV acumulado (ou derivado do avanço físico x PV total)
    actualCost: string; // AC acumulado
    physicalProgressPercent: string;
    monthlyMeasuredAmount?: string;
  }): EarnedValueMetrics {
    const pv = DecimalValue.of(params.plannedValue || '0');
    const ev = DecimalValue.of(params.earnedValue || '0');
    const ac = DecimalValue.of(params.actualCost || '0');

    // SV = EV - PV
    const sv = ev.minus(pv);

    // CV = EV - AC
    const cv = ev.minus(ac);

    // SPI = EV / PV (1.0 se ambos zero, ou 0 se PV > 0 e EV = 0)
    let spi: DecimalValue;
    if (pv.isZero()) {
      spi = ev.isZero() ? DecimalValue.of('1.0000') : DecimalValue.of('1.0000');
    } else {
      spi = ev.dividedBy(pv).round(4, 'half-up');
    }

    // CPI = EV / AC (1.0 se ambos zero, ou 0 se AC > 0 e EV = 0)
    let cpi: DecimalValue;
    if (ac.isZero()) {
      cpi = ev.isZero() ? DecimalValue.of('1.0000') : DecimalValue.of('1.0000');
    } else {
      cpi = ev.dividedBy(ac).round(4, 'half-up');
    }

    return {
      monthNumber: params.monthNumber,
      periodDate: params.periodDate,
      plannedValue: pv.toFixed(2, 'half-up'),
      earnedValue: ev.toFixed(2, 'half-up'),
      actualCost: ac.toFixed(2, 'half-up'),
      scheduleVariance: sv.toFixed(2, 'half-up'),
      costVariance: cv.toFixed(2, 'half-up'),
      schedulePerformanceIndex: spi.toFixed(4, 'half-up'),
      costPerformanceIndex: cpi.toFixed(4, 'half-up'),
      physicalProgressPercent: DecimalValue.of(
        params.physicalProgressPercent || '0',
      ).toFixed(2, 'half-up'),
      monthlyMeasuredAmount: params.monthlyMeasuredAmount
        ? DecimalValue.of(params.monthlyMeasuredAmount).toFixed(2, 'half-up')
        : undefined,
    };
  }

  /**
   * Determina o status executivo da obra com base no SPI e CPI consolidados.
   */
  static determineStatusSummary(spi: string, cpi: string): CurveSStatusSummary {
    const spiVal = DecimalValue.of(spi);
    const cpiVal = DecimalValue.of(cpi);
    const thresholdCritical = DecimalValue.of('0.90');
    const thresholdWarning = DecimalValue.of('0.95');
    const thresholdAhead = DecimalValue.of('1.05');
    const one = DecimalValue.of('1.00');

    if (
      spiVal.lessThan(thresholdCritical) &&
      cpiVal.lessThan(thresholdCritical)
    ) {
      return 'CRITICAL_DEVIATION';
    }
    if (spiVal.lessThan(thresholdWarning)) {
      return 'BEHIND_SCHEDULE';
    }
    if (cpiVal.lessThan(thresholdWarning)) {
      return 'COST_OVERRUN';
    }
    if (spiVal.greaterThan(thresholdAhead) && !cpiVal.lessThan(one)) {
      return 'AHEAD_OF_SCHEDULE';
    }
    return 'ON_TRACK';
  }

  /**
   * Consolida a Curva S completa (série temporal mês a mês) a partir da Baseline e dos Registros de Medição.
   */
  static generateCurveSData(params: {
    baseline: WorkBaseline;
    plannedSchedule: PlannedMonthlyScheduleItem[];
    progressRecords: MonthlyProgressRecord[];
  }): CurveSData {
    const totalPlanned = DecimalValue.of(
      params.baseline.totalContractValue ||
        params.baseline.totalBudgetCost ||
        '0',
    );
    const recordsMap = new Map<number, MonthlyProgressRecord>();
    for (const rec of params.progressRecords) {
      recordsMap.set(rec.monthNumber, rec);
    }

    let runningActualCost = DecimalValue.zero();
    let latestSpi = '1.0000';
    let latestCpi = '1.0000';
    let latestProgress = '0.00';

    const monthlySeries: EarnedValueMetrics[] = params.plannedSchedule.map(
      (planItem) => {
        const record = recordsMap.get(planItem.monthNumber);
        const pv = planItem.plannedCumulativeAmount;

        if (record) {
          // Se houver medição registrada no mês
          const measured = DecimalValue.of(record.monthlyMeasuredAmount || '0');
          runningActualCost = runningActualCost.plus(measured);

          const physPercent = DecimalValue.of(
            record.physicalProgressPercent || '0',
          );
          latestProgress = physPercent.toFixed(2, 'half-up');

          // EV = Total Planejado * (% Físico / 100) se não informado diretamente
          let evStr = record.earnedValueCumulative;
          if (!evStr || evStr === '0' || evStr === '0.00') {
            const evDec = totalPlanned
              .times(physPercent)
              .dividedBy(DecimalValue.of(100));
            evStr = evDec.toFixed(2, 'half-up');
          }

          const metrics = EarnedValueCalculator.calculatePeriodMetrics({
            monthNumber: planItem.monthNumber,
            periodDate: planItem.periodDate,
            plannedValue: pv,
            earnedValue: evStr,
            actualCost: runningActualCost.toFixed(2, 'half-up'),
            physicalProgressPercent: physPercent.toFixed(2, 'half-up'),
            monthlyMeasuredAmount: measured.toFixed(2, 'half-up'),
          });

          latestSpi = metrics.schedulePerformanceIndex;
          latestCpi = metrics.costPerformanceIndex;

          return metrics;
        } else {
          // Mês futuro planejado sem medição ainda
          return {
            monthNumber: planItem.monthNumber,
            periodDate: planItem.periodDate,
            plannedValue: DecimalValue.of(pv).toFixed(2, 'half-up'),
            earnedValue: '0.00',
            actualCost: '0.00',
            scheduleVariance: DecimalValue.zero()
              .minus(DecimalValue.of(pv))
              .toFixed(2, 'half-up'),
            costVariance: '0.00',
            schedulePerformanceIndex: '0.0000',
            costPerformanceIndex: '1.0000',
            physicalProgressPercent: '0.00',
          };
        }
      },
    );

    const statusSummary = EarnedValueCalculator.determineStatusSummary(
      latestSpi,
      latestCpi,
    );

    return {
      baselineId: params.baseline.id,
      totalPlannedValue: totalPlanned.toFixed(2, 'half-up'),
      currentPhysicalProgressPercent: latestProgress,
      currentSpi: latestSpi,
      currentCpi: latestCpi,
      statusSummary,
      monthlySeries,
    };
  }
}
