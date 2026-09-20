import { Inject, Injectable } from '@nestjs/common';
import {
  CurveSData,
  MonthlyProgressRecord,
  RecordMonthlyProgressPayload,
} from '@lt-offers/domain';
import {
  EarnedValueCalculator,
  PlannedMonthlyScheduleItem,
} from '@lt-offers/calc-engine';
import {
  AUDIT_TRAIL_PORT_TOKEN,
  AuditTrailPort,
  PROGRESS_RECORDS_REPOSITORY_TOKEN,
  ProgressRecordsRepository,
} from '../../domain';
import {
  GetActiveBaselineUseCase,
  GetBaselineByIdUseCase,
} from './get-baselines.usecases';

@Injectable()
export class RecordMonthlyProgressUseCase {
  constructor(
    @Inject(PROGRESS_RECORDS_REPOSITORY_TOKEN)
    private readonly progressRecords: ProgressRecordsRepository,
    @Inject(AUDIT_TRAIL_PORT_TOKEN)
    private readonly auditTrail: AuditTrailPort,
    private readonly getBaselineById: GetBaselineByIdUseCase,
  ) {}

  /**
   * Registra um novo boletim de medição mensal de avanço físico-financeiro (Fase F7, RF-08).
   */
  async execute(
    payload: RecordMonthlyProgressPayload,
    user: string,
    createdAt: Date,
  ): Promise<MonthlyProgressRecord> {
    const baseline = await this.getBaselineById.execute(payload.baselineId);

    const records = await this.progressRecords.listByBaselineId(
      payload.baselineId,
    );
    // Regra de ID herdada do legado: tamanho da lista + 1, mesmo em substituição
    const newId = records.length + 1;

    const record: MonthlyProgressRecord = {
      id: newId,
      baselineId: payload.baselineId,
      monthNumber: payload.monthNumber,
      periodDate: payload.periodDate,
      physicalProgressPercent: payload.physicalProgressPercent,
      plannedValueCumulative: '0.00', // Calculado dinamicamente na curva S
      earnedValueCumulative: '0.00',
      actualCostCumulative: '0.00',
      monthlyMeasuredAmount: payload.monthlyMeasuredAmount,
      notes: payload.notes || null,
      createdBy: user || payload.createdBy || 'engenheiro.campo@engevix.com.br',
      createdAt: createdAt.toISOString(),
      workPackageProgress: payload.workPackageProgress || [],
    };

    await this.progressRecords.upsertByMonth(record);

    // Trilha de auditoria
    this.auditTrail.logEvent({
      userId: user || 'user-field',
      userName: user || 'Engenheiro de Campo',
      userRole: 'ENGINEERING',
      resource: 'OFFER',
      resourceId: String(baseline.offerId),
      offerId: String(baseline.offerId),
      action: 'UPDATE',
      description: `Lançamento do Boletim de Medição Mês ${payload.monthNumber} (${payload.periodDate}) - Avanço Físico: ${payload.physicalProgressPercent}%, Medição: R$ ${payload.monthlyMeasuredAmount}`,
      diffs: [
        {
          field: `progress_month_${payload.monthNumber}`,
          previousValue: null,
          newValue: payload.physicalProgressPercent,
        },
      ],
    });

    return record;
  }
}

@Injectable()
export class GetCurveSUseCase {
  constructor(
    @Inject(PROGRESS_RECORDS_REPOSITORY_TOKEN)
    private readonly progressRecords: ProgressRecordsRepository,
    private readonly getBaselineById: GetBaselineByIdUseCase,
    private readonly getActiveBaseline: GetActiveBaselineUseCase,
  ) {}

  /**
   * Obtém os dados consolidados da Curva S (Previsto vs. Agregado vs.
   * Realizado) e indicadores EVM. O ano-base do cronograma planejado é
   * derivado da data de referência resolvida na borda (RNF-04).
   */
  async execute(
    offerId: number,
    referenceDate: Date,
    baselineId?: number,
  ): Promise<CurveSData> {
    const baseline = baselineId
      ? await this.getBaselineById.execute(baselineId)
      : await this.getActiveBaseline.execute(offerId);

    const records = await this.progressRecords.listByBaselineId(baseline.id);
    const monthsCount = baseline.scheduleMonths || 18;

    // Constrói a série planejada linear/acumulada
    const plannedSchedule: PlannedMonthlyScheduleItem[] = [];
    const totalContract = parseFloat(
      baseline.totalContractValue || '120000000',
    );
    const monthlyRate = totalContract / monthsCount;
    let runningPlanned = 0;

    const baseYear = referenceDate.getFullYear();
    for (let m = 1; m <= monthsCount; m++) {
      runningPlanned += monthlyRate;
      const monthStr = m < 10 ? `0${m}` : `${m}`;
      const progressPct = (m / monthsCount) * 100;

      plannedSchedule.push({
        monthNumber: m,
        periodDate: `${baseYear}-${monthStr}`,
        plannedMonthlyAmount: monthlyRate.toFixed(2),
        plannedCumulativeAmount: runningPlanned.toFixed(2),
        plannedCumulativeProgressPercent: progressPct.toFixed(2),
      });
    }

    return EarnedValueCalculator.generateCurveSData({
      baseline,
      plannedSchedule,
      progressRecords: records,
    });
  }
}

@Injectable()
export class ListProgressRecordsUseCase {
  constructor(
    @Inject(PROGRESS_RECORDS_REPOSITORY_TOKEN)
    private readonly progressRecords: ProgressRecordsRepository,
  ) {}

  async execute(baselineId: number): Promise<MonthlyProgressRecord[]> {
    return this.progressRecords.listByBaselineId(baselineId);
  }
}
