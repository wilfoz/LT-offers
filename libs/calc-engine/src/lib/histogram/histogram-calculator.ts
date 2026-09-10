import { DecimalValue } from '../decimal-value';
import {
  ScheduleActivity,
  CampDefinition,
  ResourceHistogramSummary,
  ManpowerHistogramItem,
  EquipmentHistogramItem,
  MonthlyHistogramSummaryPoint,
} from '@lt-offers/domain';

export interface WorkCrewComposition {
  id: number;
  code: string;
  name: string;
  laborRoles: {
    laborRoleId: number;
    laborRoleCode: string;
    laborRoleName: string;
    quantity: number;
    category?: string;
  }[];
  equipments: {
    equipmentId: number;
    equipmentCode: string;
    equipmentDescription: string;
    quantity: number;
    category?: string;
    monthlyRentalRate?: string;
  }[];
}

export interface OwnEquipmentAvailability {
  equipmentId: number;
  ownUnits: number;
}

export interface HistogramCalculationInput {
  lineId?: number;
  activities: ScheduleActivity[];
  crews: WorkCrewComposition[];
  camps?: CampDefinition[];
  ownFleet?: OwnEquipmentAvailability[];
}

export class HistogramCalculator {
  /**
   * Agrega e projeta o histograma mensal de recursos (mão de obra e máquinas) (RF-42..RF-45, RN-17).
   */
  static calculateHistogram(input: HistogramCalculationInput): ResourceHistogramSummary {
    const crewMap = new Map<number, WorkCrewComposition>();
    for (const c of input.crews) {
      crewMap.set(c.id, c);
    }

    const fleetMap = new Map<number, number>();
    for (const f of input.ownFleet || []) {
      fleetMap.set(f.equipmentId, f.ownUnits);
    }

    // Determina a amplitude temporal do projeto em meses
    let minMonth = 1;
    let maxMonth = 1;
    for (const a of input.activities) {
      if (a.startMonth < minMonth) minMonth = a.startMonth;
      if (a.endMonth > maxMonth) maxMonth = a.endMonth;
    }
    for (const cp of input.camps || []) {
      if (cp.startMonth < minMonth) minMonth = cp.startMonth;
      if (cp.endMonth > maxMonth) maxMonth = cp.endMonth;
    }

    const totalMonths = Math.max(1, maxMonth - minMonth + 1);

    // Mapas de agregação
    // laborRoleId -> ManpowerHistogramItem
    const manpowerMap = new Map<
      number,
      {
        laborRoleId: number;
        laborRoleCode: string;
        laborRoleName: string;
        isDirect: boolean;
        category?: string;
        monthlyCounts: Record<number, number>;
      }
    >();

    // equipmentId -> EquipmentHistogramItem
    const equipmentMap = new Map<
      number,
      {
        equipmentId: number;
        equipmentCode: string;
        equipmentDescription: string;
        category?: string;
        monthlyRentalRate: string;
        monthlyDemands: Record<number, number>;
      }
    >();

    // Atividades ativas por mês
    const activitiesActiveInMonth = new Map<number, string[]>();

    // 1. Processar Atividades do Cronograma
    for (const act of input.activities) {
      const crew = act.assignedCrewId ? crewMap.get(act.assignedCrewId) : undefined;
      const isDirect = act.group !== 'INDIRECTS' && act.group !== 'CAMPS';
      const crewCount = Math.max(1, act.crewCount);

      for (let m = act.startMonth; m <= act.endMonth; m++) {
        if (!activitiesActiveInMonth.has(m)) {
          activitiesActiveInMonth.set(m, []);
        }
        activitiesActiveInMonth.get(m)!.push(act.name);

        if (crew) {
          // Mão de Obra da Equipe
          for (const lr of crew.laborRoles) {
            if (!manpowerMap.has(lr.laborRoleId)) {
              manpowerMap.set(lr.laborRoleId, {
                laborRoleId: lr.laborRoleId,
                laborRoleCode: lr.laborRoleCode,
                laborRoleName: lr.laborRoleName,
                isDirect,
                category: lr.category,
                monthlyCounts: {},
              });
            }
            const record = manpowerMap.get(lr.laborRoleId)!;
            const delta = lr.quantity * crewCount;
            record.monthlyCounts[m] = (record.monthlyCounts[m] || 0) + delta;
          }

          // Equipamentos da Equipe
          for (const eq of crew.equipments) {
            if (!equipmentMap.has(eq.equipmentId)) {
              equipmentMap.set(eq.equipmentId, {
                equipmentId: eq.equipmentId,
                equipmentCode: eq.equipmentCode,
                equipmentDescription: eq.equipmentDescription,
                category: eq.category,
                monthlyRentalRate: eq.monthlyRentalRate || '15000.00',
                monthlyDemands: {},
              });
            }
            const eqRecord = equipmentMap.get(eq.equipmentId)!;
            const deltaEq = eq.quantity * crewCount;
            eqRecord.monthlyDemands[m] = (eqRecord.monthlyDemands[m] || 0) + deltaEq;
          }
        }
      }
    }

    // 2. Processar Canteiros de Obra (Mão de Obra Indireta)
    for (const cp of input.camps || []) {
      for (let m = cp.startMonth; m <= cp.endMonth; m++) {
        for (const p of cp.personnel || []) {
          const roleId = p.laborRoleId;
          if (!manpowerMap.has(roleId)) {
            manpowerMap.set(roleId, {
              laborRoleId: roleId,
              laborRoleCode: p.laborRoleCode || `CARGO-${roleId}`,
              laborRoleName: p.laborRoleName || `Cargo Canteiro ${roleId}`,
              isDirect: false,
              monthlyCounts: {},
            });
          }
          const rec = manpowerMap.get(roleId)!;
          rec.monthlyCounts[m] = (rec.monthlyCounts[m] || 0) + p.quantity;
        }
      }
    }

    // 3. Montar Itens de Mão de Obra
    const manpowerItems: ManpowerHistogramItem[] = [];
    let grandTotalDirectManMonths = DecimalValue.zero();
    let grandTotalIndirectManMonths = DecimalValue.zero();

    for (const [, item] of manpowerMap) {
      const monthlyHeadcount: { month: number; count: number }[] = [];
      let peakHeadcount = 0;
      let peakMonth = minMonth;
      let totalMM = DecimalValue.zero();

      for (let m = minMonth; m <= maxMonth; m++) {
        const count = item.monthlyCounts[m] || 0;
        monthlyHeadcount.push({ month: m, count });
        totalMM = totalMM.plus(DecimalValue.of(count));

        if (count > peakHeadcount) {
          peakHeadcount = count;
          peakMonth = m;
        }
      }

      if (item.isDirect) {
        grandTotalDirectManMonths = grandTotalDirectManMonths.plus(totalMM);
      } else {
        grandTotalIndirectManMonths = grandTotalIndirectManMonths.plus(totalMM);
      }

      manpowerItems.push({
        laborRoleId: item.laborRoleId,
        laborRoleCode: item.laborRoleCode,
        laborRoleName: item.laborRoleName,
        isDirect: item.isDirect,
        category: item.category,
        monthlyHeadcount,
        peakHeadcount,
        peakMonth,
        totalManMonths: totalMM.toFixed(2),
      });
    }

    // 4. Montar Itens de Equipamentos e Balanço de Frota Própria (RN-17)
    const equipmentItems: EquipmentHistogramItem[] = [];
    let grandTotalRentalCost = DecimalValue.zero();

    for (const [, eq] of equipmentMap) {
      const ownUnits = fleetMap.get(eq.equipmentId) || 0;
      const monthlyDemand: {
        month: number;
        totalRequired: number;
        ownUsed: number;
        deficitToRent: number;
        estimatedRentalCost: string;
      }[] = [];

      let peakDemand = 0;
      let peakMonth = minMonth;
      let totalMachineMonthsDec = DecimalValue.zero();
      let totalRentalMachineMonthsDec = DecimalValue.zero();
      let totalRentalCostDec = DecimalValue.zero();
      const unitRentalRateDec = DecimalValue.of(eq.monthlyRentalRate);

      for (let m = minMonth; m <= maxMonth; m++) {
        const required = eq.monthlyDemands[m] || 0;
        const ownUsed = Math.min(required, ownUnits);
        const deficit = Math.max(0, required - ownUnits);
        const monthlyCost = DecimalValue.of(deficit).times(unitRentalRateDec).round(2, 'half-up');

        totalMachineMonthsDec = totalMachineMonthsDec.plus(DecimalValue.of(required));
        totalRentalMachineMonthsDec = totalRentalMachineMonthsDec.plus(DecimalValue.of(deficit));
        totalRentalCostDec = totalRentalCostDec.plus(monthlyCost);

        monthlyDemand.push({
          month: m,
          totalRequired: required,
          ownUsed,
          deficitToRent: deficit,
          estimatedRentalCost: monthlyCost.toFixed(2),
        });

        if (required > peakDemand) {
          peakDemand = required;
          peakMonth = m;
        }
      }

      grandTotalRentalCost = grandTotalRentalCost.plus(totalRentalCostDec);

      equipmentItems.push({
        equipmentId: eq.equipmentId,
        equipmentCode: eq.equipmentCode,
        equipmentDescription: eq.equipmentDescription,
        category: eq.category,
        ownUnitsAvailable: ownUnits,
        monthlyDemand,
        peakDemand,
        peakMonth,
        totalMachineMonths: totalMachineMonthsDec.toFixed(2),
        totalRentalMachineMonths: totalRentalMachineMonthsDec.toFixed(2),
        totalRentalCost: totalRentalCostDec.toFixed(2),
      });
    }

    // 5. Timeline Mensal Consolidada e Curva S
    const monthlyTimeline: MonthlyHistogramSummaryPoint[] = [];
    let cumManMonths = DecimalValue.zero();
    let cumEqMonths = DecimalValue.zero();

    let peakManMonth = minMonth;
    let peakManDirect = 0;
    let peakManIndirect = 0;
    let peakManTotal = 0;

    let peakEqMonth = minMonth;
    let peakEqTotal = 0;
    let peakEqOwn = 0;
    let peakEqRented = 0;

    for (let m = minMonth; m <= maxMonth; m++) {
      let directCount = 0;
      let indirectCount = 0;

      for (const mi of manpowerItems) {
        const pt = mi.monthlyHeadcount.find((h) => h.month === m);
        const count = pt ? pt.count : 0;
        if (mi.isDirect) {
          directCount += count;
        } else {
          indirectCount += count;
        }
      }

      let totalEq = 0;
      let ownEq = 0;
      let rentedEq = 0;
      let monthRentalCost = DecimalValue.zero();

      for (const eq of equipmentItems) {
        const pt = eq.monthlyDemand.find((d) => d.month === m);
        if (pt) {
          totalEq += pt.totalRequired;
          ownEq += pt.ownUsed;
          rentedEq += pt.deficitToRent;
          monthRentalCost = monthRentalCost.plus(DecimalValue.of(pt.estimatedRentalCost));
        }
      }

      const totalMan = directCount + indirectCount;
      cumManMonths = cumManMonths.plus(DecimalValue.of(totalMan));
      cumEqMonths = cumEqMonths.plus(DecimalValue.of(totalEq));

      if (totalMan > peakManTotal) {
        peakManTotal = totalMan;
        peakManDirect = directCount;
        peakManIndirect = indirectCount;
        peakManMonth = m;
      }

      if (totalEq > peakEqTotal) {
        peakEqTotal = totalEq;
        peakEqOwn = ownEq;
        peakEqRented = rentedEq;
        peakEqMonth = m;
      }

      monthlyTimeline.push({
        month: m,
        directManpower: directCount,
        indirectManpower: indirectCount,
        totalManpower: totalMan,
        totalEquipment: totalEq,
        ownEquipment: ownEq,
        rentedEquipment: rentedEq,
        monthlyRentalCost: monthRentalCost.toFixed(2),
        cumulativeManMonths: cumManMonths.toFixed(2),
        cumulativeEquipmentMonths: cumEqMonths.toFixed(2),
      });
    }

    const drivingActivities = activitiesActiveInMonth.get(peakManMonth) || [];
    const grandTotalManMonths = grandTotalDirectManMonths.plus(grandTotalIndirectManMonths);

    return {
      lineId: input.lineId,
      totalMonths,
      manpowerItems,
      equipmentItems,
      monthlyTimeline,
      peakManpower: {
        month: peakManMonth,
        direct: peakManDirect,
        indirect: peakManIndirect,
        total: peakManTotal,
        drivingActivities: Array.from(new Set(drivingActivities)),
      },
      peakEquipment: {
        month: peakEqMonth,
        total: peakEqTotal,
        own: peakEqOwn,
        rented: peakEqRented,
      },
      totalDirectManMonths: grandTotalDirectManMonths.toFixed(2),
      totalIndirectManMonths: grandTotalIndirectManMonths.toFixed(2),
      totalManMonths: grandTotalManMonths.toFixed(2),
      totalEquipmentRentalCost: grandTotalRentalCost.toFixed(2),
    };
  }
}
