import { Inject, Injectable } from '@nestjs/common';
import {
  RiskAssessmentSummary,
  RisksRepository,
  RISKS_REPOSITORY_TOKEN,
} from '../../domain';
import { GetOfferRisksUseCase } from './get-offer-risks.usecase';

@Injectable()
export class DeleteRiskUseCase {
  constructor(
    @Inject(RISKS_REPOSITORY_TOKEN)
    private readonly repository: RisksRepository,
    private readonly getOfferRisksUseCase: GetOfferRisksUseCase,
  ) {}

  async execute(
    offerId: string,
    riskId: string,
    lineId?: string,
  ): Promise<RiskAssessmentSummary> {
    await this.repository.delete(offerId, riskId);
    return this.getOfferRisksUseCase.execute(offerId, lineId);
  }
}
