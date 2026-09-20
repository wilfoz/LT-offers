import { Inject, Injectable } from '@nestjs/common';
import { CashflowExportData } from '@lt-offers/domain';
import { EconomicsFacadeService } from '../../../economics';
import {
  EXPORT_DATA_QUERY_PORT_TOKEN,
  ExportDataQueryPort,
  OfferExportNotFoundException,
} from '../../domain';

@Injectable()
export class GetCashflowExportDataUseCase {
  constructor(
    @Inject(EXPORT_DATA_QUERY_PORT_TOKEN)
    private readonly queryPort: ExportDataQueryPort,
    private readonly economicsFacade: EconomicsFacadeService,
  ) {}

  /**
   * Constrói os dados do Cronograma de Faturamento e Desembolso Mensal (RF-60).
   */
  async execute(offerId: number): Promise<CashflowExportData> {
    const offer = await this.queryPort.findOfferExportData(offerId);
    if (!offer) {
      throw new OfferExportNotFoundException(offerId);
    }

    const cashflowSummary =
      await this.economicsFacade.getConsolidatedCashflow(offerId);

    const peakMonth = cashflowSummary.financialExposure?.peakMonth || 1;
    const peakAmount =
      cashflowSummary.financialExposure?.maxNegativeExposure || '0.00';

    const months = cashflowSummary.monthlyPoints.map((pt) => ({
      monthIndex: pt.month,
      monthLabel: `Mês ${String(pt.month).padStart(2, '0')}`,
      suppliesDisbursement: pt.materialsOutflow,
      servicesDisbursement: pt.servicesOutflow,
      indirectDisbursement: pt.indirectsOutflow,
      monthlyTotalDisbursement: pt.totalOutflow,
      accumulatedDisbursement: pt.accumulatedOutflow,
      monthlyBilling: pt.totalInflow,
      accumulatedBilling: pt.accumulatedInflow,
      netCashflow: pt.netMonthlyCashflow,
      isPeakExposure: pt.month === peakMonth,
    }));

    return {
      offerId: String(offerId),
      offerName: offer.name || `Proposta #${offerId}`,
      revisionNumber: offer.revisionNumber,
      generatedAt: new Date().toISOString(),
      months,
      peakExposureMonth: peakMonth,
      peakExposureAmount: peakAmount,
      totalDisbursement: cashflowSummary.totalOutflow,
      totalBilling: cashflowSummary.totalInflow,
    };
  }
}
