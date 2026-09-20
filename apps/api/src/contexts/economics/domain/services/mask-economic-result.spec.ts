import {
  CANONICAL_USERS,
  EconomicResultSummary,
  canViewSensitiveCommercialData,
} from '@lt-offers/domain';
import { maskEconomicResult } from './mask-economic-result';

const summary = {
  offerId: '1',
  lineName: 'LT Teste',
  totalNetCost: '1000.00',
  totalSalePrice: '1500.00',
  grossProfit: '300.00',
  grossMarginPercent: '20.00',
  netMarginPercent: '8.00',
  bdi: {
    totalIndirectRate: '18.45',
    grossMarginRate: '8.00',
    effectiveBdiRate: '30.63',
    bdiMultiplier: '1.3063',
  },
  coefficients: {
    guaranteesRate: '1.50',
    insurancesRate: '1.00',
    productionTaxRate: '5.65',
    iddeRate: '0.50',
    countryRiskRate: '1.00',
    financialCostRate: '1.80',
    contingencyRate: '2.50',
    centralStructureRate: '4.50',
    targetMarginRate: '8.00',
  },
} as unknown as EconomicResultSummary;

describe('maskEconomicResult (RNF-17)', () => {
  const commercialUser = CANONICAL_USERS.find((u) =>
    canViewSensitiveCommercialData(u),
  );
  const technicalUser = CANONICAL_USERS.find(
    (u) => !canViewSensitiveCommercialData(u),
  );

  it('deve preservar o resumo integral para papel com permissão comercial sensível', () => {
    expect(commercialUser).toBeDefined();
    const result = maskEconomicResult(summary, commercialUser!);
    expect(result).toBe(summary);
    expect(result.totalSalePrice).toBe('1500.00');
  });

  it('deve zerar preço de venda, margens, BDI e coeficientes para papel técnico', () => {
    expect(technicalUser).toBeDefined();
    const result = maskEconomicResult(summary, technicalUser!);
    expect(result.totalSalePrice).toBe('0.00');
    expect(result.grossProfit).toBe('0.00');
    expect(result.grossMarginPercent).toBe('0.00');
    expect(result.netMarginPercent).toBe('0.00');
    expect(result.bdi.effectiveBdiRate).toBe('0.00');
    expect(result.bdi.bdiMultiplier).toBe('1.0000');
    expect(result.coefficients.targetMarginRate).toBe('0.00');
    // Custos não sensíveis permanecem visíveis
    expect(result.totalNetCost).toBe('1000.00');
  });
});
