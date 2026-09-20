import {
  EconomicResultSummary,
  UserProfile,
  canViewSensitiveCommercialData,
} from '@lt-offers/domain';

/**
 * Mascaramento de dados comerciais confidenciais para perfis técnicos
 * (RNF-17): preço de venda, margens, BDI e coeficientes são zerados
 * quando o papel do usuário não tem permissão de leitura sensível.
 */
export function maskEconomicResult(
  summary: EconomicResultSummary,
  user: UserProfile,
): EconomicResultSummary {
  if (canViewSensitiveCommercialData(user)) {
    return summary;
  }

  return {
    ...summary,
    totalSalePrice: '0.00',
    grossProfit: '0.00',
    grossMarginPercent: '0.00',
    netMarginPercent: '0.00',
    bdi: {
      totalIndirectRate: '0.00',
      grossMarginRate: '0.00',
      effectiveBdiRate: '0.00',
      bdiMultiplier: '1.0000',
    },
    coefficients: {
      guaranteesRate: '0.00',
      insurancesRate: '0.00',
      productionTaxRate: '0.00',
      iddeRate: '0.00',
      countryRiskRate: '0.00',
      financialCostRate: '0.00',
      contingencyRate: '0.00',
      centralStructureRate: '0.00',
      targetMarginRate: '0.00',
    },
  };
}
