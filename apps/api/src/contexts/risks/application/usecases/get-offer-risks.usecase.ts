import { Inject, Injectable } from '@nestjs/common';
import { RiskCalculator } from '@lt-offers/calc-engine';
import {
  RiskAssessmentSummary,
  RisksRepository,
  RISKS_REPOSITORY_TOKEN,
} from '../../domain';

@Injectable()
export class GetOfferRisksUseCase {
  constructor(
    @Inject(RISKS_REPOSITORY_TOKEN)
    private readonly repository: RisksRepository,
  ) {}

  async execute(
    offerId: string,
    lineId?: string,
  ): Promise<RiskAssessmentSummary> {
    const items = await this.repository.findByOffer(offerId, lineId);
    const filtered = lineId
      ? items.filter((i) => !i.lineId || i.lineId === lineId)
      : items;
    return RiskCalculator.assessRisks(offerId, filtered, lineId);
  }
}
