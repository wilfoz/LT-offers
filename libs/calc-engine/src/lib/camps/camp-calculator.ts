import { DecimalValue } from '../decimal-value';
import { CampDefinition, CampCostSummary, CampPersonnelItem } from '@lt-offers/domain';

export class CampCalculator {
  /**
   * Calcula o custo de um canteiro individual detalhando pessoal, operação e implantação (RF-41).
   */
  static calculateSingleCamp(camp: Omit<CampDefinition, 'totalPersonnelMonthlyCost' | 'totalMonthlyCost' | 'totalCampCost'>): CampDefinition {
    let personnelMonthlyCostDec = DecimalValue.zero();

    const calculatedPersonnel: CampPersonnelItem[] = (camp.personnel || []).map((p) => {
      const qty = DecimalValue.of(p.quantity);
      const unitCost = DecimalValue.of(p.monthlyUnitCost || '0');
      const total = qty.times(unitCost).round(2, 'half-up');
      personnelMonthlyCostDec = personnelMonthlyCostDec.plus(total);

      return {
        ...p,
        monthlyUnitCost: unitCost.toFixed(2),
        totalMonthlyCost: total.toFixed(2),
      };
    });

    const fixedMonthlyCostDec = DecimalValue.of(camp.fixedMonthlyCost || '0');
    const totalMonthlyCostDec = fixedMonthlyCostDec.plus(personnelMonthlyCostDec);

    const implCostDec = DecimalValue.of(camp.implementationCost || '0');
    const demobCostDec = DecimalValue.of(camp.demobilizationCost || '0');
    const durationDec = DecimalValue.of(Math.max(1, camp.durationMonths));

    const totalOpCost = totalMonthlyCostDec.times(durationDec);
    const totalCampCostDec = implCostDec.plus(totalOpCost).plus(demobCostDec);

    const endMonth = camp.startMonth + camp.durationMonths - 1;

    return {
      ...camp,
      endMonth,
      personnel: calculatedPersonnel,
      totalPersonnelMonthlyCost: personnelMonthlyCostDec.toFixed(2),
      fixedMonthlyCost: fixedMonthlyCostDec.toFixed(2),
      totalMonthlyCost: totalMonthlyCostDec.toFixed(2),
      implementationCost: implCostDec.toFixed(2),
      demobilizationCost: demobCostDec.toFixed(2),
      totalCampCost: totalCampCostDec.toFixed(2),
    };
  }

  /**
   * Consolida todos os canteiros da linha e projeta a curva de desembolso mensal.
   */
  static calculateSummary(lineId: number, rawCamps: Omit<CampDefinition, 'totalPersonnelMonthlyCost' | 'totalMonthlyCost' | 'totalCampCost'>[]): CampCostSummary {
    const calculatedCamps = rawCamps.map((c) => this.calculateSingleCamp(c));

    let totalImpl = DecimalValue.zero();
    let totalOp = DecimalValue.zero();
    let totalDemob = DecimalValue.zero();

    const monthlyMap: Record<number, DecimalValue> = {};

    for (const c of calculatedCamps) {
      const impl = DecimalValue.of(c.implementationCost);
      const demob = DecimalValue.of(c.demobilizationCost);
      const monthly = DecimalValue.of(c.totalMonthlyCost);

      totalImpl = totalImpl.plus(impl);
      totalDemob = totalDemob.plus(demob);
      totalOp = totalOp.plus(monthly.times(DecimalValue.of(c.durationMonths)));

      // Distribuição Mês a Mês
      // Mês inicial: Implantação + 1º Mês de Operação
      // Meses intermediários: Operação
      // Mês final: Operação + Desmobilização
      for (let m = c.startMonth; m <= c.endMonth; m++) {
        if (!monthlyMap[m]) {
          monthlyMap[m] = DecimalValue.zero();
        }

        let monthSum = monthly; // Custo fixo + pessoal
        if (m === c.startMonth) {
          monthSum = monthSum.plus(impl);
        }
        if (m === c.endMonth) {
          monthSum = monthSum.plus(demob);
        }

        monthlyMap[m] = monthlyMap[m].plus(monthSum);
      }
    }

    const totalCamps = totalImpl.plus(totalOp).plus(totalDemob);

    const sortedMonths = Object.keys(monthlyMap)
      .map(Number)
      .sort((a, b) => a - b);

    const monthlyDistribution = sortedMonths.map((m) => ({
      month: m,
      cost: monthlyMap[m].toFixed(2),
    }));

    return {
      lineId,
      camps: calculatedCamps,
      totalImplementationCost: totalImpl.toFixed(2),
      totalOperatingCost: totalOp.toFixed(2),
      totalDemobilizationCost: totalDemob.toFixed(2),
      totalCampsCost: totalCamps.toFixed(2),
      monthlyDistribution,
    };
  }
}
