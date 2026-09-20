import { Inject, Injectable } from '@nestjs/common';
import { EconomicResultSummary, SaleCoefficients } from '@lt-offers/domain';
import {
  EconomicResultCalculator,
  EconomicResultInput,
} from '@lt-offers/calc-engine';
import {
  DEFAULT_COEFFICIENTS,
  ECONOMICS_DATA_QUERY_PORT_TOKEN,
  EconomicsDataQueryPort,
  EconomicsLineNotFoundException,
} from '../../domain';

@Injectable()
export class GetLineEconomicResultUseCase {
  constructor(
    @Inject(ECONOMICS_DATA_QUERY_PORT_TOKEN)
    private readonly economicsData: EconomicsDataQueryPort,
  ) {}

  /**
   * Resultado econômico da linha (M10): custos estimados de M05/M06/M07
   * com coeficientes comerciais delegados ao EconomicResultCalculator.
   */
  async execute(
    lineId: number,
    customCoeffs?: Partial<SaleCoefficients>,
  ): Promise<EconomicResultSummary> {
    const line = await this.economicsData.findLineEconomicsData(lineId);

    if (!line) {
      throw new EconomicsLineNotFoundException(lineId);
    }

    const coeffs: SaleCoefficients = {
      ...DEFAULT_COEFFICIENTS,
      ...customCoeffs,
    };

    const lengthKm = Number(line.refinedLengthKm || line.reportLengthKm || 100);
    const totalTowers = Math.max(1, Math.round(lengthKm * 2.5));

    // Custos estimados baseados em M05, M06 e M07
    const materialsNetCost = lengthKm * 125000 + totalTowers * 45000;
    const servicesNetCost = lengthKm * 55000 + totalTowers * 27500;
    const indirectsNetCost = lengthKm * 18000;

    const input: EconomicResultInput = {
      offerId: String(line.offerId),
      lineId: String(lineId),
      lineName: line.name || `Linha de Transmissão ${lineId}`,
      materials: {
        netCost: materialsNetCost.toFixed(2),
        pisCofins: (materialsNetCost * 0.0925).toFixed(2),
        ipi: (materialsNetCost * 0.05).toFixed(2),
        icmsOrigin: (materialsNetCost * 0.12).toFixed(2),
        difal: (materialsNetCost * 0.06).toFixed(2),
        fecoep: (materialsNetCost * 0.02).toFixed(2),
        costWithTaxes: (materialsNetCost * 1.3425).toFixed(2),
        directBilling: (materialsNetCost * 0.15).toFixed(2), // 15% faturamento direto do cliente
      },
      services: {
        netCost: servicesNetCost.toFixed(2),
        pisCofins: (servicesNetCost * 0.0925).toFixed(2),
        costWithTaxes: (servicesNetCost * 1.0925).toFixed(2),
        directBilling: '0.00',
      },
      indirectsCamps: {
        netCost: indirectsNetCost.toFixed(2),
        costWithTaxes: indirectsNetCost.toFixed(2),
      },
      spareParts: {
        netCost: (materialsNetCost * 0.03).toFixed(2),
        costWithTaxes: (materialsNetCost * 0.03 * 1.3425).toFixed(2),
      },
      coefficients: coeffs,
      ipcaAnnualRate: '4.50',
      projectDurationMonths: 18,
    };

    return EconomicResultCalculator.calculateEconomicResult(input);
  }
}
