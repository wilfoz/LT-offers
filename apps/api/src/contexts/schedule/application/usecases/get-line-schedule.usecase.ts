import { Inject, Injectable } from '@nestjs/common';
import { ScheduleCalculator } from '@lt-offers/calc-engine';
import {
  DEFAULT_RAINFALL_PARAMETERS,
  DEFAULT_WORK_CALENDAR,
} from '@lt-offers/domain';
import {
  LineSchedule,
  LineScheduleNotFoundException,
  ScheduleDataQueryPort,
  SCHEDULE_DATA_QUERY_PORT_TOKEN,
} from '../../domain';

@Injectable()
export class GetLineScheduleUseCase {
  constructor(
    @Inject(SCHEDULE_DATA_QUERY_PORT_TOKEN)
    private readonly dataQueryPort: ScheduleDataQueryPort,
  ) {}

  async execute(lineId: number): Promise<LineSchedule> {
    const data = await this.dataQueryPort.findLineScheduleData(lineId);

    if (!data) {
      throw new LineScheduleNotFoundException(lineId);
    }

    // Defaults da domain (idênticos ao seed) até a porta resolver a versão
    // vigente dos catálogos por data de referência (task 4.3 desta change).
    return ScheduleCalculator.calculateSchedule({
      lineId: data.lineId,
      lineName: data.lineName,
      uf: data.uf,
      startMonth: data.startMonth,
      rainfallParameters: DEFAULT_RAINFALL_PARAMETERS,
      workCalendar: DEFAULT_WORK_CALENDAR,
      activities: data.activitiesInput,
      milestones: data.milestones,
    });
  }
}
