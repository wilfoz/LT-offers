import {
  ViabilityAssessmentResponse,
  assessViability,
  auctionBenchmark,
} from '@lt-offers/domain';
import {
  NoEffectiveViabilityParametersException,
  ViabilityRevisionNotFoundException,
} from '../../domain/exceptions/viability.exceptions';
import { ViabilityAuctionStatsPort } from '../../domain/ports/viability-auction-stats.port';
import { ViabilityOfferQueryPort } from '../../domain/ports/viability-offer-query.port';
import { ViabilityParametersRepository } from '../../domain/ports/viability-parameters.repository';

/**
 * Parecer de viabilidade da revisão (M13): campos financeiros da revisão +
 * parâmetros vigentes pela DATA DA OFERTA (RNF-05 — o parecer é
 * reproduzível) + deságios praticados do snapshot local (RNF-04).
 */
export class GetViabilityAssessmentUseCase {
  constructor(
    private readonly offerQuery: ViabilityOfferQueryPort,
    private readonly parameters: ViabilityParametersRepository,
    private readonly auctionStats: ViabilityAuctionStatsPort,
  ) {}

  async execute(
    offerId: number,
    revisionId: number,
  ): Promise<ViabilityAssessmentResponse> {
    const revision = await this.offerQuery.findRevisionFinancials(
      offerId,
      revisionId,
    );
    if (!revision) {
      throw new ViabilityRevisionNotFoundException(offerId, revisionId);
    }

    const effective = await this.parameters.findEffective(revision.offerDate);
    if (!effective) {
      throw new NoEffectiveViabilityParametersException(revision.offerDate);
    }

    const [auctionRows, allRows] = await Promise.all([
      revision.auctionNumber
        ? this.auctionStats.findByAuction(revision.auctionNumber)
        : Promise.resolve([]),
      this.auctionStats.findDiscountRows(),
    ]);

    return {
      assessment: assessViability(revision, effective),
      parameters: effective,
      auctionStats:
        auctionRows.length === 0 ? null : auctionBenchmark(auctionRows),
      overallStats: auctionBenchmark(allRows),
    };
  }
}
