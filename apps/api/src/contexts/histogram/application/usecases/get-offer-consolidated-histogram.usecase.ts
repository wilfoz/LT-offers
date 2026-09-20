import { Inject, Injectable } from '@nestjs/common';
import { HistogramCalculator } from '@lt-offers/calc-engine';
import { ScheduleFacadeService } from '../../../schedule';
import {
  ConsolidatedHistogram,
  HistogramOfferQueryPort,
  HISTOGRAM_OFFER_QUERY_PORT_TOKEN,
  OfferHistogramNotFoundException,
  getDefaultHistogramCrews,
  getDefaultHistogramOwnFleet,
} from '../../domain';

@Injectable()
export class GetOfferConsolidatedHistogramUseCase {
  constructor(
    @Inject(HISTOGRAM_OFFER_QUERY_PORT_TOKEN)
    private readonly offerQueryPort: HistogramOfferQueryPort,
    private readonly scheduleFacade: ScheduleFacadeService,
  ) {}

  async execute(offerId: number): Promise<ConsolidatedHistogram> {
    const offerData = await this.offerQueryPort.findOfferLines(offerId);

    if (!offerData) {
      throw new OfferHistogramNotFoundException(offerId);
    }

    const crews = getDefaultHistogramCrews();
    const ownFleet = getDefaultHistogramOwnFleet();

    if (offerData.lines.length === 0) {
      return HistogramCalculator.calculateHistogram({
        activities: [],
        crews,
        camps: [],
        ownFleet,
      });
    }

    // Consolida atividades e canteiros de todas as linhas da oferta
    let allActivities: any[] = [];
    let allCamps: any[] = [];

    for (const line of offerData.lines) {
      const sch = await this.scheduleFacade.getLineSchedule(line.id);
      const cp = await this.scheduleFacade.getLineCamps(line.id);
      allActivities = allActivities.concat(sch.activities);
      allCamps = allCamps.concat(cp.camps);
    }

    return HistogramCalculator.calculateHistogram({
      activities: allActivities,
      crews,
      camps: allCamps,
      ownFleet,
    });
  }
}
