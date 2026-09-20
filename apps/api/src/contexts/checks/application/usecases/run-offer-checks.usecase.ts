import { Inject, Injectable } from '@nestjs/common';
import {
  ConsistencyEngine,
  ConsistencyEngineInput,
} from '@lt-offers/calc-engine';
import { OfferHealthSummary } from '@lt-offers/domain';
import {
  CHECKS_DATA_QUERY_PORT_TOKEN,
  ChecksDataQueryPort,
  OfferChecksNotFoundException,
} from '../../domain';

@Injectable()
export class RunOfferChecksUseCase {
  constructor(
    @Inject(CHECKS_DATA_QUERY_PORT_TOKEN)
    private readonly queryPort: ChecksDataQueryPort,
  ) {}

  async execute(offerId: string | number): Promise<OfferHealthSummary> {
    const stringOfferId = String(offerId);

    const exists = await this.queryPort.checkOfferExists(stringOfferId);
    if (!exists) {
      throw new OfferChecksNotFoundException(offerId);
    }

    const [
      stakingLines,
      materials,
      scheduleActivities,
      histogramDeficits,
      services,
      cashflow,
    ] = await Promise.all([
      this.queryPort.getStakingData(stringOfferId),
      this.queryPort.getMaterialsData(stringOfferId),
      this.queryPort.getScheduleData(stringOfferId),
      this.queryPort.getHistogramData(stringOfferId),
      this.queryPort.getServicesData(stringOfferId),
      this.queryPort.getCashflowData(stringOfferId),
    ]);

    const input: ConsistencyEngineInput = {
      offerId: stringOfferId,
      stakingLines,
      materials,
      scheduleActivities,
      histogramDeficits,
      services,
      cashflow,
    };

    return ConsistencyEngine.evaluate(input);
  }
}
