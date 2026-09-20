import { DecimalValue } from '../decimal-value';
import {
  ScheduleActivity,
  MilestoneContract,
  ScheduleSummary,
  ActivityScheduleStatus,
  ActivityGroup,
} from '@lt-offers/domain';
import { PrecipitationCalculator } from './precipitation-calculator';

export interface ScheduleCalculationInput {
  lineId: number;
  lineName?: string;
  uf: string;
  startMonth: number;
  accessDifficultyFactor?: number | string;
  activities: {
    id: string;
    code: string;
    name: string;
    group: ActivityGroup;
    quantitySource: any;
    totalQuantity: string;
    quantityUnit: string;
    assignedCrewId?: number;
    assignedCrewName?: string;
    crewCount: number;
    nominalMonthlyProductionPerCrew: string;
    maxMonthlyProductionPerCrew?: string;
    accessDifficultyFactor?: number | string;
    startMonth: number;
    durationMonths?: number; // Se não fornecido, calculado pela produção
    monthlyCostPerCrew: string; // Salários, encargos, alimentação, etc. (RN-14)
    mobilizationCostPerCrew?: string;
    demobilizationCostPerCrew?: string;
    predecessors?: { activityId: string; type: any; lagMonths: number }[];
  }[];
  milestones?: MilestoneContract[];
}

export class ScheduleCalculator {
  /**
   * Calcula o cronograma físico completo com durações, produções, custos e validações (RF-35..RF-39, RN-14..RN-16).
   */
  static calculateSchedule(input: ScheduleCalculationInput): ScheduleSummary {
    const calculatedActivities: ScheduleActivity[] = [];
    const globalWarnings: string[] = [];

    const liMilestone = input.milestones?.find((m) => m.code === 'LI');
    const loMilestone = input.milestones?.find((m) => m.code === 'LO');

    let maxProjectEndMonth = input.startMonth;
    let totalDirectLaborCost = DecimalValue.zero();
    const totalEquipmentCost = DecimalValue.zero();
    let totalIndirectCost = DecimalValue.zero();

    for (const actInput of input.activities) {
      const crewCountDec = DecimalValue.of(Math.max(1, actInput.crewCount));
      const totalQtyDec = DecimalValue.of(actInput.totalQuantity || '0');
      const nominalProdDec = DecimalValue.of(
        actInput.nominalMonthlyProductionPerCrew || '1',
      );

      // Fator de severidade de acesso (RN-15, RF-36)
      const accessFactorRaw =
        actInput.accessDifficultyFactor ?? input.accessDifficultyFactor ?? 1;
      const accessFactorDec = DecimalValue.of(accessFactorRaw);
      const safeAccessFactor = accessFactorDec.isZero()
        ? DecimalValue.of(1)
        : accessFactorDec;

      // Estimação inicial de duração baseada na produção nominal
      let estimatedDuration = actInput.durationMonths;
      if (!estimatedDuration || estimatedDuration <= 0) {
        if (totalQtyDec.isZero() || nominalProdDec.isZero()) {
          estimatedDuration = 1;
        } else {
          // Ajusta pelo fator de chuva estimado e severidade de acesso
          const initialAvgRainFactor =
            PrecipitationCalculator.getAverageProductivityFactor(
              input.uf,
              actInput.startMonth,
              6,
            );
          // Produção efetiva mensal = (nominal * equipes * chuva) / acesso
          const effectiveMonthlyProd = nominalProdDec
            .times(crewCountDec)
            .times(initialAvgRainFactor)
            .dividedBy(safeAccessFactor);

          const rawDuration = totalQtyDec
            .dividedBy(effectiveMonthlyProd)
            .toNumber();
          estimatedDuration = Math.max(1, Math.ceil(rawDuration));
        }
      }

      const durationMonths = estimatedDuration;
      const endMonth = actInput.startMonth + durationMonths - 1;
      if (endMonth > maxProjectEndMonth) {
        maxProjectEndMonth = endMonth;
      }

      // Produção mensal exigida pela divisão linear do quantitativo no período
      const requiredMonthlyProd = totalQtyDec
        .dividedBy(DecimalValue.of(durationMonths))
        .round(2, 'half-up');

      // Custos
      const mobCostPerCrew = DecimalValue.of(
        actInput.mobilizationCostPerCrew || '0',
      );
      const demobCostPerCrew = DecimalValue.of(
        actInput.demobilizationCostPerCrew || '0',
      );
      const monthlyCostPerCrew = DecimalValue.of(
        actInput.monthlyCostPerCrew || '0',
      );

      const mobCost = mobCostPerCrew.times(crewCountDec);
      const demobCost = demobCostPerCrew.times(crewCountDec);
      const monthlyRecurring = monthlyCostPerCrew.times(crewCountDec);
      const totalRecurring = monthlyRecurring.times(
        DecimalValue.of(durationMonths),
      );
      const totalCost = mobCost.plus(totalRecurring).plus(demobCost);

      if (actInput.group === 'INDIRECTS' || actInput.group === 'CAMPS') {
        totalIndirectCost = totalIndirectCost.plus(totalCost);
      } else {
        totalDirectLaborCost = totalDirectLaborCost.plus(totalCost);
      }

      // Validações e Alertas
      let status: ActivityScheduleStatus = 'PLANNED';
      const statusNotes: string[] = [];

      // 1. Validação de Sobreprodução (RN-15, RF-38)
      if (actInput.maxMonthlyProductionPerCrew) {
        const maxProdPerCrew = DecimalValue.of(
          actInput.maxMonthlyProductionPerCrew,
        );
        const totalMaxAllowed = maxProdPerCrew.times(crewCountDec);
        if (requiredMonthlyProd.greaterThan(totalMaxAllowed)) {
          status = 'WARNING_OVERPRODUCTION';
          const msg = `Atividade '${actInput.name}': produção exigida (${requiredMonthlyProd.toText()} ${actInput.quantityUnit}/mês) excede o limite máximo da equipe (${totalMaxAllowed.toText()} ${actInput.quantityUnit}/mês).`;
          statusNotes.push(msg);
          globalWarnings.push(msg);
        }
      }

      // 2. Validação de Licença de Instalação (LI) (RF-39)
      if (
        liMilestone &&
        actInput.group !== 'INDIRECTS' &&
        actInput.group !== 'CAMPS' &&
        actInput.startMonth < liMilestone.targetMonth
      ) {
        status =
          status === 'WARNING_OVERPRODUCTION'
            ? 'CRITICAL'
            : 'WARNING_PRECEDENCE';
        const msg = `Atividade '${actInput.name}' agendada para início no Mês ${actInput.startMonth}, antes da obtenção da Licença de Instalação (Mês ${liMilestone.targetMonth}).`;
        statusNotes.push(msg);
        globalWarnings.push(msg);
      }

      // 3. Validação de Operação Comercial (LO) (RF-39)
      if (loMilestone && endMonth > loMilestone.targetMonth) {
        status = 'CRITICAL';
        const msg = `Atividade '${actInput.name}' termina no Mês ${endMonth}, após o marco contratual de Operação Comercial (Mês ${loMilestone.targetMonth}).`;
        statusNotes.push(msg);
        globalWarnings.push(msg);
      }

      calculatedActivities.push({
        id: actInput.id,
        lineId: input.lineId,
        code: actInput.code,
        name: actInput.name,
        group: actInput.group,
        quantitySource: actInput.quantitySource,
        totalQuantity: totalQtyDec.toFixed(2),
        quantityUnit: actInput.quantityUnit,
        assignedCrewId: actInput.assignedCrewId,
        assignedCrewName: actInput.assignedCrewName,
        crewCount: actInput.crewCount,
        startMonth: actInput.startMonth,
        durationMonths,
        endMonth,
        monthlyProduction: requiredMonthlyProd.toFixed(2),
        maxMonthlyProduction: actInput.maxMonthlyProductionPerCrew
          ? DecimalValue.of(actInput.maxMonthlyProductionPerCrew)
              .times(crewCountDec)
              .toFixed(2)
          : undefined,
        accessDifficultyFactor: safeAccessFactor.toFixed(2),
        predecessors: actInput.predecessors || [],
        mobilizationCost: mobCost.toFixed(2),
        monthlyRecurringCost: monthlyRecurring.toFixed(2),
        demobilizationCost: demobCost.toFixed(2),
        totalCost: totalCost.toFixed(2),
        status,
        statusNotes: statusNotes.length > 0 ? statusNotes : undefined,
      });
    }

    const totalScheduleCost = totalDirectLaborCost
      .plus(totalEquipmentCost)
      .plus(totalIndirectCost);
    const totalDurationMonths = maxProjectEndMonth - input.startMonth + 1;

    return {
      lineId: input.lineId,
      lineName: input.lineName,
      startMonth: input.startMonth,
      totalDurationMonths,
      activities: calculatedActivities,
      milestones: input.milestones || [],
      totalDirectLaborCost: totalDirectLaborCost.toFixed(2),
      totalEquipmentCost: totalEquipmentCost.toFixed(2),
      totalIndirectCost: totalIndirectCost.toFixed(2),
      totalScheduleCost: totalScheduleCost.toFixed(2),
      warnings: globalWarnings,
    };
  }
}
