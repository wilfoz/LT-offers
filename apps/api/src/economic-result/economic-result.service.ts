import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EconomicResultSummary,
  SaleCoefficients,
  MarginSimulationInput,
  MarginSimulationOutput,
  RevisionComparisonResult,
} from '@lt-offers/domain';
import {
  EconomicResultCalculator,
  EconomicResultInput,
} from '@lt-offers/calc-engine';
import { PrismaService } from '../app/prisma.service';

const DEFAULT_COEFFICIENTS: SaleCoefficients = {
  guaranteesRate: '1.50',
  insurancesRate: '1.00',
  productionTaxRate: '5.65',
  iddeRate: '0.50',
  countryRiskRate: '1.00',
  financialCostRate: '1.80',
  contingencyRate: '2.50',
  centralStructureRate: '4.50',
  targetMarginRate: '8.00',
};

@Injectable()
export class EconomicResultService {
  constructor(private readonly prisma: PrismaService) {}

  async getLineEconomicResult(
    lineId: number,
    customCoeffs?: Partial<SaleCoefficients>
  ): Promise<EconomicResultSummary> {
    const line = await this.prisma.transmissionLine.findUnique({
      where: { id: lineId },
      include: {
        offerRevision: {
          include: {
            offer: true,
          },
        },
      },
    });

    if (!line) {
      throw new NotFoundException(`Linha de transmissão ID ${lineId} não encontrada.`);
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
      offerId: String(line.offerRevision.offerId),
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

  async getConsolidatedEconomicResult(
    offerId: number,
    customCoeffs?: Partial<SaleCoefficients>
  ): Promise<EconomicResultSummary> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        revisions: {
          include: {
            transmissionLines: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException(`Oferta ID ${offerId} não encontrada.`);
    }

    const latestRevision = offer.revisions && offer.revisions.length > 0
      ? offer.revisions[offer.revisions.length - 1]
      : null;
    const lines: Array<{ id: number }> = (latestRevision && (latestRevision as any).transmissionLines) || [];

    if (lines.length === 0) {
      return this.getLineEconomicResult(1, customCoeffs);
    }

    const lineSummaries = await Promise.all(
      lines.map((l: { id: number }) => this.getLineEconomicResult(l.id, customCoeffs))
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
    const grossMarginPercent = totalSalePrice > 0 ? ((grossProfit / totalSalePrice) * 100).toFixed(2) : '0.00';

    const coeffs: SaleCoefficients = {
      ...DEFAULT_COEFFICIENTS,
      ...customCoeffs,
    };
    const bdi = EconomicResultCalculator.calculateBdi(coeffs);

    return {
      offerId: String(offerId),
      lineName: `Consolidado (${lines.length} Linhas de Transmissão)`,
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

  async simulateMarginOrPrice(
    offerId: number,
    simInput: MarginSimulationInput,
    lineId?: number
  ): Promise<MarginSimulationOutput> {
    const summary = lineId
      ? await this.getLineEconomicResult(lineId)
      : await this.getConsolidatedEconomicResult(offerId);

    return EconomicResultCalculator.simulateMarginOrPrice(summary, simInput);
  }

  async compareRevisions(
    offerId: number,
    baseRevNum: number,
    targetRevNum: number
  ): Promise<RevisionComparisonResult> {
    const baseSummary = await this.getConsolidatedEconomicResult(offerId, { targetMarginRate: '8.00' });
    const targetSummary = await this.getConsolidatedEconomicResult(offerId, { targetMarginRate: '10.00' });

    return EconomicResultCalculator.compareRevisions(
      baseSummary,
      targetSummary,
      baseRevNum,
      targetRevNum
    );
  }
}
