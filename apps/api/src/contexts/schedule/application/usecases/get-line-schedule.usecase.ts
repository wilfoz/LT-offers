import { Inject, Injectable } from '@nestjs/common';
import { ScheduleCalculator } from '@lt-offers/calc-engine';
import {
  LineSchedule,
  LineScheduleNotFoundException,
  ScheduleDataQueryPort,
  SCHEDULE_DATA_QUERY_PORT_TOKEN,
} from '../../domain';
import { GetEffectiveRainfallParametersUseCase } from './rainfall-parameters.usecases';
import { GetEffectiveWorkCalendarUseCase } from './work-calendar.usecases';

@Injectable()
export class GetLineScheduleUseCase {
  constructor(
    @Inject(SCHEDULE_DATA_QUERY_PORT_TOKEN)
    private readonly dataQueryPort: ScheduleDataQueryPort,
    private readonly getEffectiveRainfall: GetEffectiveRainfallParametersUseCase,
    private readonly getEffectiveWorkCalendar: GetEffectiveWorkCalendarUseCase,
  ) {}

  async execute(lineId: number): Promise<LineSchedule> {
    const data = await this.dataQueryPort.findLineScheduleData(lineId);

    if (!data) {
      throw new LineScheduleNotFoundException(lineId);
    }

    // Versões vigentes na data de referência da oferta (RNF-05): uma oferta
    // fechada reproduz seus números mesmo após edições dos catálogos.
    const [rainfall, workCalendar] = await Promise.all([
      this.getEffectiveRainfall.execute(data.referenceDate),
      this.getEffectiveWorkCalendar.execute(data.referenceDate),
    ]);

    return ScheduleCalculator.calculateSchedule({
      lineId: data.lineId,
      lineName: data.lineName,
      uf: data.uf,
      startMonth: data.startMonth,
      scheduleStartDate: data.scheduleStartDate,
      rainfallParameters: rainfall.parameters,
      workCalendar: workCalendar.calendar,
      activities: data.activitiesInput,
      milestones: data.milestones,
    });
  }
}
