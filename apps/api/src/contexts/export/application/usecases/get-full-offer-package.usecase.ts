import { Inject, Injectable } from '@nestjs/common';
import { FullOfferPackage } from '@lt-offers/domain';
import { EconomicsFacadeService } from '../../../economics';
import {
  EXPORT_DATA_QUERY_PORT_TOKEN,
  ExportDataQueryPort,
  OfferExportNotFoundException,
} from '../../domain';
import { GetPerformanceIndicatorsUseCase } from './get-performance-indicators.usecase';

@Injectable()
export class GetFullOfferPackageUseCase {
  constructor(
    @Inject(EXPORT_DATA_QUERY_PORT_TOKEN)
    private readonly queryPort: ExportDataQueryPort,
    private readonly economicsFacade: EconomicsFacadeService,
    private readonly getPerformanceIndicatorsUseCase: GetPerformanceIndicatorsUseCase,
  ) {}

  /**
   * Constrói o Pacote Aberto Integral da Oferta em formato JSON (RNF-18).
   */
  async execute(offerId: number): Promise<FullOfferPackage> {
    const offer = await this.queryPort.findOfferExportData(offerId);
    if (!offer) {
      throw new OfferExportNotFoundException(offerId);
    }

    const lines = offer.transmissionLines || [];
    const performanceIndicators =
      await this.getPerformanceIndicatorsUseCase.execute(offerId);
    const econSummary =
      await this.economicsFacade.getConsolidatedEconomicResult(offerId);
    const cashflowSummary =
      await this.economicsFacade.getConsolidatedCashflow(offerId);

    return {
      metadata: {
        exportTimestamp: new Date().toISOString(),
        version: '1.0.0',
        schemaVersion: 'open-lt-offer-v1',
        exportedBy: 'LT-Offers System',
      },
      offer: {
        id: offer.id,
        name: offer.name,
        code: offer.code || `PROP-${offer.id}`,
        client: offer.client || 'Concessionária Transmissão',
        createdAt: offer.createdAt,
      },
      transmissionLines: lines.map((l) => ({
        id: l.id,
        name: l.name,
        voltageKv: l.voltageKv || 500,
        lengthKm: Number(l.refinedLengthKm || l.reportLengthKm || 100),
      })),
      staking: [],
      pricingSummary: econSummary as unknown as Record<string, unknown>,
      bdiParameters: (econSummary.coefficients || {}) as unknown as Record<
        string,
        unknown
      >,
      cashflow: cashflowSummary as unknown as Record<string, unknown>,
      risks: [],
      governance: {
        approvalStatus: 'IN_REVIEW',
      },
      performanceIndicators,
    };
  }
}
