import { Inject, Injectable } from '@nestjs/common';
import {
  RiskAssessmentSummary,
  RiskItem,
  RisksRepository,
  RISKS_REPOSITORY_TOKEN,
} from '../../domain';
import { GetOfferRisksUseCase } from './get-offer-risks.usecase';

@Injectable()
export class SaveRiskUseCase {
  constructor(
    @Inject(RISKS_REPOSITORY_TOKEN)
    private readonly repository: RisksRepository,
    private readonly getOfferRisksUseCase: GetOfferRisksUseCase,
  ) {}

  async execute(
    offerId: string,
    item: Partial<RiskItem>,
  ): Promise<RiskAssessmentSummary> {
    const id =
      item.id ||
      `risk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const riskItem = RiskItem.create({
      id,
      offerId,
      lineId: item.lineId,
      category: item.category || 'OTHER',
      description: item.description || '',
      situation: item.situation || '',
      mitigationAction: item.mitigationAction || '',
      estimatedImpact: item.estimatedImpact || '0',
      probabilityPercent: item.probabilityPercent || '0',
      treatment: item.treatment || 'CONTINGENCY_BDI',
    });

    await this.repository.save(offerId, riskItem);
    return this.getOfferRisksUseCase.execute(offerId, item.lineId);
  }
}
