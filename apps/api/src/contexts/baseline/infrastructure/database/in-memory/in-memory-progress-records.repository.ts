import { Injectable } from '@nestjs/common';
import { MonthlyProgressRecord } from '@lt-offers/domain';
import { ProgressRecordsRepository } from '../../../domain';

/**
 * Repositório in-memory dos boletins de medição, com seeds do legado e
 * upsert por mês mantendo a ordenação (design, decisão 4).
 */
@Injectable()
export class InMemoryProgressRecordsRepository implements ProgressRecordsRepository {
  private readonly progressRecords: Map<number, MonthlyProgressRecord[]> =
    new Map();

  constructor() {
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

  async listByBaselineId(baselineId: number): Promise<MonthlyProgressRecord[]> {
    return this.progressRecords.get(baselineId) || [];
  }

  async upsertByMonth(
    record: MonthlyProgressRecord,
  ): Promise<MonthlyProgressRecord> {
    const records = this.progressRecords.get(record.baselineId) || [];

    const existingIndex = records.findIndex(
      (r) => r.monthNumber === record.monthNumber,
    );
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    records.sort((a, b) => a.monthNumber - b.monthNumber);
    this.progressRecords.set(record.baselineId, records);
    return record;
  }
}
