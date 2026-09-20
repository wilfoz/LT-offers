import { Inject, Injectable } from '@nestjs/common';
import { ScheduleCalculator } from '@lt-offers/calc-engine';
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

    return ScheduleCalculator.calculateSchedule({
      lineId: data.lineId,
      lineName: data.lineName,
      uf: data.uf,
      startMonth: data.startMonth,
      activities: data.activitiesInput,
      milestones: data.milestones,
    });
  }
}
