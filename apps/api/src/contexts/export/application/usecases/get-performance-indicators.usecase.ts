import { Inject, Injectable } from '@nestjs/common';
import { PerformanceIndicatorsSummary } from '@lt-offers/domain';
import {
  PerformanceIndicatorsCalculator,
  LinePerformanceData,
} from '@lt-offers/calc-engine';
import { EconomicsFacadeService } from '../../../economics';
import {
  EXPORT_DATA_QUERY_PORT_TOKEN,
  ExportDataQueryPort,
  OfferExportNotFoundException,
} from '../../domain';

@Injectable()
export class GetPerformanceIndicatorsUseCase {
  constructor(
    @Inject(EXPORT_DATA_QUERY_PORT_TOKEN)
    private readonly queryPort: ExportDataQueryPort,
    private readonly economicsFacade: EconomicsFacadeService,
  ) {}

  /**
   * Obtém os indicadores sintéticos de desempenho e custo para benchmarking (RF-49).
   */
  async execute(offerId: number): Promise<PerformanceIndicatorsSummary> {
    const offer = await this.queryPort.findOfferExportData(offerId);
    if (!offer) {
      throw new OfferExportNotFoundException(offerId);
    }

    const lines = offer.transmissionLines || [];
    const lineInputs: LinePerformanceData[] = [];

    if (lines.length === 0) {
      const econResult = await this.economicsFacade.getLineEconomicResult(1);
      lineInputs.push({
        lineId: '1',
        lineName: 'LT Padrão 500kV',
        lengthKm: 100,
        towerCount: 250,
        totalSalePrice: econResult.totalSalePrice,
        suppliesSalePrice: (Number(econResult.totalSalePrice) * 0.62).toFixed(
          2,
        ),
        servicesSalePrice: (Number(econResult.totalSalePrice) * 0.38).toFixed(
          2,
        ),
        totalConcreteVolumeM3: 12000,
        totalSteelWeightTons: 4500,
      });
    } else {
      for (const line of lines) {
        const lengthKm = Number(
          line.refinedLengthKm || line.reportLengthKm || 100,
        );
        const towerCount = Math.max(1, Math.round(lengthKm * 2.5));
        const econResult = await this.economicsFacade.getLineEconomicResult(
          line.id,
        );

        lineInputs.push({
          lineId: String(line.id),
          lineName: line.name || `Linha de Transmissão ${line.id}`,
          lengthKm,
          towerCount,
          totalSalePrice: econResult.totalSalePrice,
          suppliesSalePrice: (Number(econResult.totalSalePrice) * 0.62).toFixed(
            2,
          ),
          servicesSalePrice: (Number(econResult.totalSalePrice) * 0.38).toFixed(
            2,
          ),
          totalConcreteVolumeM3: Math.round(towerCount * 48),
          totalSteelWeightTons: Math.round(towerCount * 18),
        });
      }
    }

    return PerformanceIndicatorsCalculator.calculateSummary({
      offerId: String(offerId),
      lines: lineInputs,
    });
  }
}
