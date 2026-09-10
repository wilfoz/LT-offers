/**
 * Tipos de commodities metálicas utilizadas em LTs (RN-07, RF-30).
 */
export const COMMODITY_TYPES = ['ALUMINUM', 'COPPER', 'STEEL_ZINC'] as const;
export type CommodityType = (typeof COMMODITY_TYPES)[number];

export const COMMODITY_TYPE_LABELS: Record<CommodityType, string> = {
  ALUMINUM: 'Alumínio (LME + Midwest/RTDU)',
  COPPER: 'Cobre (LME Grade A)',
  STEEL_ZINC: 'Aço Galvanizado',
};

/**
 * Modalidade de formação de preço de commodity (RN-08).
 * - SPOT: Cotação à vista na data base da proposta (risco assumido pelo cliente).
 * - FUTURES_WEIGHTED: Curva de preços futuros da bolsa ponderada pelo cronograma mensal de entregas (risco assumido pela contratada).
 */
export const COMMODITY_PRICING_MODES = ['SPOT', 'FUTURES_WEIGHTED'] as const;
export type CommodityPricingMode = (typeof COMMODITY_PRICING_MODES)[number];

/**
 * Cotação mensal na curva de futuros da commodity (RN-09, RF-31).
 */
export interface MonthlyCommodityFutureQuote {
  monthIndex: number; // 1, 2, 3... correspondente ao mês de obra
  monthLabel?: string; // ex.: 'Mês 01', 'Jan/2026'
  lmePriceUsdPerTon: number; // Cotação LME futura em USD/tonelada
  midwestPremiumUsdPerTon: number; // Prêmio regional Midwest/RTDU em USD/tonelada
  projectedExchangeRateBrl: number; // Taxa de câmbio projetada para o mês (BRL/USD)
  deliveryWeightTons: number; // Quantidade de toneladas entregues no mês (extraída do cronograma)
}

/**
 * Parâmetros de precificação de commodities para cabos e materiais metálicos (RN-07, RN-08, RF-30).
 */
export interface CommodityPricingConfig {
  commodityType: CommodityType;
  pricingMode: CommodityPricingMode;
  spotLmeUsdPerTon: number; // Cotação spot LME em USD/tonelada
  spotMidwestPremiumUsdPerTon: number; // Prêmio regional spot (Midwest/RTDU) em USD/tonelada
  spotExchangeRateBrl: number; // Taxa de câmbio spot da oferta (BRL/USD)
  fabricationPremiumBrlPerTon: number; // Prêmio de manufatura/transformação cobrado pelo fabricante em BRL/tonelada
  futuresCurve?: MonthlyCommodityFutureQuote[]; // Curva mensal quando em modo FUTURES_WEIGHTED
}

/**
 * Resultado da formação de preço por tonelada de commodity (RN-07, RN-09).
 */
export interface FormedCommodityPrice {
  commodityType: CommodityType;
  pricingMode: CommodityPricingMode;
  effectiveLmeUsdPerTon: number; // Preço LME efetivo (spot ou ponderado)
  effectiveMidwestUsdPerTon: number; // Prêmio Midwest efetivo
  effectiveExchangeRateBrl: number; // Taxa de câmbio efetiva
  metalBasePriceBrlPerTon: number; // (LME + Midwest) * Câmbio em BRL/t
  fabricationPremiumBrlPerTon: number; // Prêmio do fabricante em BRL/t
  totalMetalPriceBrlPerTon: number; // Preço final da tonelada em BRL
  totalDeliveryWeightTons: number; // Total de toneladas entregues consideradas
}
