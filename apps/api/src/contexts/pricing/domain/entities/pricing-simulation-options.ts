import { MaterialQuote, TaxRegime } from '@lt-offers/domain';

/**
 * Opções de simulação de precificação: regime tributário, spots de
 * commodity/câmbio e overrides pontuais de cotações (RF-31, RF-34).
 */
export interface PricingSimulationOptions {
  taxRegime?: TaxRegime;
  spotLmeUsdPerTon?: number;
  spotMidwestPremiumUsdPerTon?: number;
  spotExchangeRateBrl?: number;
  quotesOverrides?: Record<string, Partial<MaterialQuote>>;
}
