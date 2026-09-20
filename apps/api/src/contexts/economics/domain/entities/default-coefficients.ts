import { SaleCoefficients } from '@lt-offers/domain';

/**
 * Coeficientes comerciais padrão do resultado econômico (M10). Valores
 * herdados da change servicos-resultado-economico-desembolso (F5).
 */
export const DEFAULT_COEFFICIENTS: SaleCoefficients = {
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
