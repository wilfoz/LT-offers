import {
  ContractChangeOrder,
  CurrentWorkingEstimate,
  WorkBaseline,
} from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';

export class ChangeOrderCalculator {
  /**
   * Consolida os aditivos e pleitos aprovados/submetidos e calcula o Current Working Estimate (CWE).
   */
  static calculateCwe(params: {
    baseline: WorkBaseline;
    changeOrders: ContractChangeOrder[];
  }): CurrentWorkingEstimate {
    const baseContractValue = DecimalValue.of(params.baseline.totalContractValue || '0');
    const baseBudgetCost = DecimalValue.of(params.baseline.totalBudgetCost || '0');
    const baseScheduleMonths = params.baseline.scheduleMonths || 0;

    let totalApproved = DecimalValue.zero();
    let totalPending = DecimalValue.zero();
    let approvedScheduleDelta = 0;
    let approvedCount = 0;

    for (const co of params.changeOrders) {
      if (co.status === 'APPROVED') {
        const approvedCost = DecimalValue.of(co.approvedCostDelta || co.requestedCostDelta || '0');
        totalApproved = totalApproved.plus(approvedCost);
        approvedScheduleDelta += co.scheduleDeltaMonths || 0;
        approvedCount++;
      } else if (co.status === 'SUBMITTED' || co.status === 'DRAFT') {
        const pendingCost = DecimalValue.of(co.requestedCostDelta || '0');
        totalPending = totalPending.plus(pendingCost);
      }
    }

    // CWE = Baseline Contract Value + Total Approved Additives
    const cweValue = baseContractValue.plus(totalApproved);
    const cweScheduleMonths = baseScheduleMonths + approvedScheduleDelta;

    return {
      baselineId: params.baseline.id,
      baselineContractValue: baseContractValue.toFixed(2, 'half-up'),
      baselineBudgetCost: baseBudgetCost.toFixed(2, 'half-up'),
      baselineScheduleMonths: baseScheduleMonths,
      totalApprovedAdditivesCost: totalApproved.toFixed(2, 'half-up'),
      totalPendingAdditivesCost: totalPending.toFixed(2, 'half-up'),
      approvedScheduleDeltaMonths: approvedScheduleDelta,
      currentWorkingEstimateValue: cweValue.toFixed(2, 'half-up'),
      currentWorkingScheduleMonths: cweScheduleMonths,
      changeOrdersCount: params.changeOrders.length,
      approvedChangeOrdersCount: approvedCount,
    };
  }
}
