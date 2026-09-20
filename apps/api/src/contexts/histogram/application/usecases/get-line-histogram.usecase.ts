import { Injectable } from '@nestjs/common';
import { HistogramCalculator } from '@lt-offers/calc-engine';
import { ScheduleFacadeService } from '../../../schedule';
import {
  LineHistogram,
  getDefaultHistogramCrews,
  getDefaultHistogramOwnFleet,
} from '../../domain';

@Injectable()
export class GetLineHistogramUseCase {
  constructor(private readonly scheduleFacade: ScheduleFacadeService) {}

  async execute(lineId: number): Promise<LineHistogram> {
    const scheduleSummary = await this.scheduleFacade.getLineSchedule(lineId);
    const campsSummary = await this.scheduleFacade.getLineCamps(lineId);

    const crews = getDefaultHistogramCrews();
    const ownFleet = getDefaultHistogramOwnFleet();

    return HistogramCalculator.calculateHistogram({
      lineId,
      activities: scheduleSummary.activities,
      crews,
      camps: campsSummary.camps,
      ownFleet,
    });
  }
}
