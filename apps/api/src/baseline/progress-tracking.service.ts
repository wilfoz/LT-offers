import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CurveSData,
  MonthlyProgressRecord,
  RecordMonthlyProgressPayload,
} from '@lt-offers/domain';
import {
  EarnedValueCalculator,
  PlannedMonthlyScheduleItem,
} from '@lt-offers/calc-engine';
import { BaselineService } from './baseline.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProgressTrackingService {
  private progressRecords: Map<number, MonthlyProgressRecord[]> = new Map(); // baselineId -> records

  constructor(
    private readonly baselineService: BaselineService,
    private readonly auditService: AuditService,
  ) {
    this.seedDefaultProgressRecords();
  }

  private seedDefaultProgressRecords(): void {
    const seedRecords: MonthlyProgressRecord[] = [
      {
        id: 1,
        baselineId: 1,
        monthNumber: 1,
        periodDate: '2026-01',
        physicalProgressPercent: '4.50',
        plannedValueCumulative: '6936111.11',
        earnedValueCumulative: '5618250.00',
        actualCostCumulative: '5400000.00',
        monthlyMeasuredAmount: '5400000.00',
        notes: 'Mobilização inicial e topografia da LT-01 concluídas.',
        createdBy: 'eng.residente@engevix.com.br',
        createdAt: '2026-02-05T14:00:00.000Z',
      },
      {
        id: 2,
        baselineId: 1,
        monthNumber: 2,
        periodDate: '2026-02',
        physicalProgressPercent: '11.20',
        plannedValueCumulative: '13872222.22',
        earnedValueCumulative: '13983200.00',
        actualCostCumulative: '13200000.00',
        monthlyMeasuredAmount: '7800000.00',
        notes: 'Abertura de cavas e fundações dos primeiros 40 piquetes.',
        createdBy: 'eng.residente@engevix.com.br',
        createdAt: '2026-03-05T14:00:00.000Z',
      },
      {
        id: 3,
        baselineId: 1,
        monthNumber: 3,
        periodDate: '2026-03',
        physicalProgressPercent: '19.80',
        plannedValueCumulative: '20808333.33',
        earnedValueCumulative: '24720300.00',
        actualCostCumulative: '22500000.00',
        monthlyMeasuredAmount: '9300000.00',
        notes: 'Início da montagem de estruturas autoportantes e concretagem.',
        createdBy: 'eng.residente@engevix.com.br',
        createdAt: '2026-04-05T14:00:00.000Z',
      },
    ];

    this.progressRecords.set(1, seedRecords);
  }

  /**
   * Registra um novo boletim de medição mensal de avanço físico-financeiro (Fase F7, RF-08).
   */
  async recordMonthlyProgress(
    payload: RecordMonthlyProgressPayload,
    user: string,
  ): Promise<MonthlyProgressRecord> {
    const baseline = await this.baselineService.getBaselineById(
      payload.baselineId,
    );
    if (!baseline) {
      throw new NotFoundException(
        `Linha de base ID ${payload.baselineId} não encontrada.`,
      );
    }

    const records = this.progressRecords.get(payload.baselineId) || [];
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
      createdAt: new Date().toISOString(),
      workPackageProgress: payload.workPackageProgress || [],
    };

    // Atualiza ou insere o registro do mês
    const existingIndex = records.findIndex(
      (r) => r.monthNumber === payload.monthNumber,
    );
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    records.sort((a, b) => a.monthNumber - b.monthNumber);
    this.progressRecords.set(payload.baselineId, records);

    // Trilha de auditoria
    this.auditService.logEvent({
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

  /**
   * Obtém os dados consolidados da Curva S (Previsto vs. Agregado vs. Realizado) e indicadores EVM.
   */
  async getCurveS(offerId: number, baselineId?: number): Promise<CurveSData> {
    const baseline = baselineId
      ? await this.baselineService.getBaselineById(baselineId)
      : await this.baselineService.getActiveBaseline(offerId);

    const records = this.progressRecords.get(baseline.id) || [];
    const monthsCount = baseline.scheduleMonths || 18;

    // Constrói a série planejada linear/acumulada
    const plannedSchedule: PlannedMonthlyScheduleItem[] = [];
    const totalContract = parseFloat(
      baseline.totalContractValue || '120000000',
    );
    const monthlyRate = totalContract / monthsCount;
    let runningPlanned = 0;

    const baseYear = new Date().getFullYear();
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

  /**
   * Lista todos os boletins de medição de uma baseline.
   */
  async listProgressRecords(
    baselineId: number,
  ): Promise<MonthlyProgressRecord[]> {
    return this.progressRecords.get(baselineId) || [];
  }
}
