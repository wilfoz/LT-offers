import { Inject, Injectable } from '@nestjs/common';
import { CampCalculator } from '@lt-offers/calc-engine';
import {
  CampPlan,
  LineScheduleNotFoundException,
  ScheduleDataQueryPort,
  SCHEDULE_DATA_QUERY_PORT_TOKEN,
} from '../../domain';

@Injectable()
export class GetLineCampsUseCase {
  constructor(
    @Inject(SCHEDULE_DATA_QUERY_PORT_TOKEN)
    private readonly dataQueryPort: ScheduleDataQueryPort,
  ) {}

  async execute(lineId: number): Promise<CampPlan> {
    const data = await this.dataQueryPort.findLineCampsData(lineId);

    if (!data) {
      throw new LineScheduleNotFoundException(lineId);
    }

    return CampCalculator.calculateSummary(lineId, data.rawCamps);
  }
}
