import { Inject, Injectable } from '@nestjs/common';
import { EconomicResultSummary, SaleCoefficients } from '@lt-offers/domain';
import { EconomicResultCalculator } from '@lt-offers/calc-engine';
import {
  DEFAULT_COEFFICIENTS,
  ECONOMICS_DATA_QUERY_PORT_TOKEN,
  EconomicsDataQueryPort,
  EconomicsOfferNotFoundException,
} from '../../domain';
import { GetLineEconomicResultUseCase } from './get-line-economic-result.usecase';

@Injectable()
export class GetConsolidatedEconomicResultUseCase {
  constructor(
    @Inject(ECONOMICS_DATA_QUERY_PORT_TOKEN)
    private readonly economicsData: EconomicsDataQueryPort,
    private readonly getLineEconomicResult: GetLineEconomicResultUseCase,
  ) {}

  /**
   * Resultado econômico consolidado da oferta: soma dos totais por linha
   * da última revisão, com BDI recalculado dos coeficientes.
   */
  async execute(
    offerId: number,
    customCoeffs?: Partial<SaleCoefficients>,
  ): Promise<EconomicResultSummary> {
    const lineIds = await this.economicsData.findOfferLineIds(offerId);

    if (lineIds === null) {
      throw new EconomicsOfferNotFoundException(offerId);
    }

    if (lineIds.length === 0) {
      return this.getLineEconomicResult.execute(1, customCoeffs);
    }

    const lineSummaries = await Promise.all(
      lineIds.map((id) => this.getLineEconomicResult.execute(id, customCoeffs)),
    );

    // Consolida somando os totais
    let totalNet = 0;
    let totalPisCofins = 0;
    let totalIpi = 0;
    let totalIcms = 0;
    let totalDifal = 0;
    let totalFecoep = 0;
    let totalCostWithTaxes = 0;
    let totalDirectBilling = 0;
    let totalOwnCost = 0;
    let totalSalePrice = 0;

    for (const ls of lineSummaries) {
      totalNet += Number(ls.totalNetCost);
      totalPisCofins += Number(ls.totalPisCofins);
      totalIpi += Number(ls.totalIpi);
      totalIcms += Number(ls.totalIcmsOrigin);
      totalDifal += Number(ls.totalDifal);
      totalFecoep += Number(ls.totalFecoep);
      totalCostWithTaxes += Number(ls.totalCostWithTaxes);
      totalDirectBilling += Number(ls.totalDirectBilling);
      totalOwnCost += Number(ls.totalOwnCost);
      totalSalePrice += Number(ls.totalSalePrice);
    }

    const grossProfit = totalSalePrice - totalCostWithTaxes;
    const grossMarginPercent =
      totalSalePrice > 0
        ? ((grossProfit / totalSalePrice) * 100).toFixed(2)
        : '0.00';

    const coeffs: SaleCoefficients = {
      ...DEFAULT_COEFFICIENTS,
      ...customCoeffs,
    };
    const bdi = EconomicResultCalculator.calculateBdi(coeffs);

    return {
      offerId: String(offerId),
      lineName: `Consolidado (${lineIds.length} Linhas de Transmissão)`,
      lines: lineSummaries[0].lines, // Estrutura de linhas de exemplo
      totalNetCost: totalNet.toFixed(2),
      totalPisCofins: totalPisCofins.toFixed(2),
      totalIpi: totalIpi.toFixed(2),
      totalIcmsOrigin: totalIcms.toFixed(2),
      totalDifal: totalDifal.toFixed(2),
      totalFecoep: totalFecoep.toFixed(2),
      totalCostWithTaxes: totalCostWithTaxes.toFixed(2),
      totalDirectBilling: totalDirectBilling.toFixed(2),
      totalOwnCost: totalOwnCost.toFixed(2),
      totalSalePrice: totalSalePrice.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      grossMarginPercent,
      netMarginPercent: coeffs.targetMarginRate,
      coefficients: coeffs,
      bdi,
      ipcaAnnualRate: '4.50',
      projectDurationMonths: 18,
      ipcaTotalDegradationCost: (totalOwnCost * 0.03375).toFixed(2),
    };
  }
}
