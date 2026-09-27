import { DecimalValue } from '../decimal-value';
import {
  ActivityMonthlyPlanEntry,
  ActivityGroup,
  ActivityScheduleStatus,
  CivilMonth,
  MilestoneContract,
  RainfallParameters,
  ScheduleActivity,
  ScheduleSummary,
  WorkCalendarParameters,
  civilMonthOfProjectMonth,
  isValidCivilDate,
} from '@lt-offers/domain';
import { PrecipitationCalculator } from './precipitation-calculator';
import { WorkCalendarCalculator } from './work-calendar-calculator';

export interface ScheduleCalculationInput {
  lineId: number;
  lineName?: string;
  uf: string;
  startMonth: number;
  /**
   * Data civil (AAAA-MM-DD) que ancora o mês 1 do cronograma no calendário
   * real. Ausente = pendência de primeira classe (RNF-09): o cálculo usa
   * meses cíclicos sem fator de calendário e emite alerta explícito.
   */
  scheduleStartDate?: string;
  /** Parâmetros de chuva vigentes, resolvidos na borda (RN-16, design D2). */
  rainfallParameters: RainfallParameters;
  /** Calendário de trabalho vigente, resolvido na borda. */
  workCalendar: WorkCalendarParameters;
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

/** Horizonte máximo de uma atividade antes de abortar com erro explícito. */
export const MAX_ACTIVITY_HORIZON_MONTHS = 600;

/** Grupos de custo mensal fixo, fora da penalização de chuva e calendário. */
const FIXED_COST_GROUPS: ActivityGroup[] = ['INDIRECTS', 'CAMPS'];

export class ScheduleCalculator {
  /**
   * Calcula o cronograma físico completo com durações, produções, custos e
   * validações (RF-35..RF-39, RN-14..RN-16). A duração de atividades
   * dimensionadas por produção é obtida por consumo do quantitativo mês a
   * mês, com a produção efetiva composta de cada mês civil:
   * nominal × equipes × fatorChuva × fatorCalendário ÷ dificuldadeAcesso.
   */
  static calculateSchedule(input: ScheduleCalculationInput): ScheduleSummary {
    const calculatedActivities: ScheduleActivity[] = [];
    const globalWarnings: string[] = [];

    // Ancoragem civil do mês 1 (RNF-09: ausência é pendência explícita).
    const anchorDate =
      input.scheduleStartDate && isValidCivilDate(input.scheduleStartDate)
        ? input.scheduleStartDate
        : undefined;
    if (!anchorDate) {
      globalWarnings.push(
        input.scheduleStartDate
          ? `Data de início do cronograma inválida ('${input.scheduleStartDate}'): feriados e dias não laborais não foram considerados no cálculo.`
          : 'Data de início do cronograma não informada: feriados e dias não laborais não foram considerados no cálculo.',
      );
    }

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

      // Chuva e calendário só penalizam atividades dimensionadas por
      // produção; grupos de custo mensal fixo ficam fora.
      const applyFactors = !FIXED_COST_GROUPS.includes(actInput.group);

      const statusNotes: string[] = [];
      let monthlyBreakdown: ActivityMonthlyPlanEntry[] | undefined;
      let peakPlannedProduction = DecimalValue.zero();

      // Duração: fornecida pelo usuário (linear, comportamento original) ou
      // calculada por consumo do quantitativo mês a mês.
      let durationMonths = actInput.durationMonths;
      if (!durationMonths || durationMonths <= 0) {
        if (totalQtyDec.isZero() || nominalProdDec.isZero()) {
          durationMonths = 1;
        } else {
          monthlyBreakdown = [];
          let remaining = totalQtyDec;
          let projectMonth = actInput.startMonth;

          while (remaining.greaterThan(DecimalValue.zero())) {
            if (
              projectMonth - actInput.startMonth >=
              MAX_ACTIVITY_HORIZON_MONTHS
            ) {
              throw new Error(
                `Atividade '${actInput.name}': o consumo do quantitativo ultrapassou o horizonte máximo de ${MAX_ACTIVITY_HORIZON_MONTHS} meses — verifique os fatores de produtividade e o calendário de trabalho vigentes.`,
              );
            }

            // Resolução do mês civil (ancorado) ou calendário cíclico.
            let civil: CivilMonth | undefined;
            let calendarMonth: number;
            if (anchorDate) {
              civil = civilMonthOfProjectMonth(anchorDate, projectMonth);
              calendarMonth = civil.month;
            } else {
              calendarMonth = ((((projectMonth - 1) % 12) + 12) % 12) + 1;
            }

            const rainFactor = applyFactors
              ? DecimalValue.of(
                  PrecipitationCalculator.getPrecipitationForUfAndMonth(
                    input.uf,
                    calendarMonth,
                    input.rainfallParameters,
                  ).productivityFactor,
                )
              : DecimalValue.of(1);
            const calendarFactor =
              applyFactors && civil
                ? WorkCalendarCalculator.getCalendarFactor(
                    input.workCalendar,
                    civil,
                    input.uf,
                  )
                : DecimalValue.of(1);

            // Produção efetiva composta do mês (2 casas half-up).
            const effective = nominalProdDec
              .times(crewCountDec)
              .times(rainFactor)
              .times(calendarFactor)
              .dividedBy(safeAccessFactor)
              .round(2, 'half-up');

            const planned = remaining.greaterThan(effective)
              ? effective
              : remaining;

            monthlyBreakdown.push({
              projectMonth,
              civilYear: civil?.year,
              civilMonth: civil?.month,
              rainfallFactor: rainFactor.toFixed(4),
              calendarFactor: calendarFactor.toFixed(4),
              effectiveProduction: effective.toFixed(2),
              plannedProduction: planned.toFixed(2),
            });

            if (effective.isZero()) {
              // Mês parado: avança sem consumo, com alerta explícito.
              const msg = `Atividade '${actInput.name}': mês ${projectMonth} sem produção efetiva — a atividade avança sem consumo no período.`;
              statusNotes.push(msg);
              globalWarnings.push(msg);
              projectMonth++;
              continue;
            }

            if (planned.greaterThan(peakPlannedProduction)) {
              peakPlannedProduction = planned;
            }
            remaining = remaining.minus(effective);
            projectMonth++;
          }

          durationMonths = projectMonth - actInput.startMonth;
        }
      }

      const endMonth = actInput.startMonth + durationMonths - 1;
      if (endMonth > maxProjectEndMonth) {
        maxProjectEndMonth = endMonth;
      }

      // Produção mensal média reportada (divisão linear do quantitativo).
      const requiredMonthlyProd = totalQtyDec
        .dividedBy(DecimalValue.of(durationMonths))
        .round(2, 'half-up');

      // Produção usada na validação RN-15: com duração fixada pelo usuário é
      // a exigência linear; com consumo mês a mês é o pico programado real.
      const validationMonthlyProd = monthlyBreakdown
        ? peakPlannedProduction
        : requiredMonthlyProd;

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

      if (FIXED_COST_GROUPS.includes(actInput.group)) {
        totalIndirectCost = totalIndirectCost.plus(totalCost);
      } else {
        totalDirectLaborCost = totalDirectLaborCost.plus(totalCost);
      }

      // Validações e Alertas
      let status: ActivityScheduleStatus = 'PLANNED';

      // 1. Validação de Sobreprodução (RN-15, RF-38)
      if (actInput.maxMonthlyProductionPerCrew) {
        const maxProdPerCrew = DecimalValue.of(
          actInput.maxMonthlyProductionPerCrew,
        );
        const totalMaxAllowed = maxProdPerCrew.times(crewCountDec);
        if (validationMonthlyProd.greaterThan(totalMaxAllowed)) {
          status = 'WARNING_OVERPRODUCTION';
          const msg = `Atividade '${actInput.name}': produção exigida (${validationMonthlyProd.toText()} ${actInput.quantityUnit}/mês) excede o limite máximo da equipe (${totalMaxAllowed.toText()} ${actInput.quantityUnit}/mês).`;
          statusNotes.push(msg);
          globalWarnings.push(msg);
        }
      }

      // 2. Validação de Licença de Instalação (LI) (RF-39)
      if (
        liMilestone &&
        !FIXED_COST_GROUPS.includes(actInput.group) &&
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
        monthlyBreakdown,
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
      scheduleStartDate: anchorDate,
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
