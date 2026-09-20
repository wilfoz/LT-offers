import {
  CommodityPricingConfig,
  FormedCommodityPrice,
} from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';

/**
 * Calculador puro de precificação de commodities metálicas (RN-07, RN-08, RN-09, RF-30, RF-31).
 *
 * Fórmula base: (LME + Midwest) * Câmbio + Prêmio Fabricante
 */
export class CommodityCalculator {
  /**
   * Calcula o preço formado da tonelada de commodity (em BRL).
   */
  static calculatePricePerTon(
    config: CommodityPricingConfig,
  ): FormedCommodityPrice {
    if (
      config.pricingMode === 'FUTURES_WEIGHTED' &&
      config.futuresCurve &&
      config.futuresCurve.length > 0
    ) {
      return this.calculateFuturesWeightedPrice(config);
    }

    return this.calculateSpotPrice(config);
  }

  /**
   * Formação de preço Spot à vista (RN-07, RN-08).
   */
  private static calculateSpotPrice(
    config: CommodityPricingConfig,
  ): FormedCommodityPrice {
    const lme = DecimalValue.of(config.spotLmeUsdPerTon);
    const midwest = DecimalValue.of(config.spotMidwestPremiumUsdPerTon);
    const fx = DecimalValue.of(config.spotExchangeRateBrl);
    const fabrication = DecimalValue.of(config.fabricationPremiumBrlPerTon);

    // Metal Base = (LME + Midwest) * Câmbio
    const metalBase = lme.plus(midwest).times(fx).round(2, 'half-up');
    const totalMetal = metalBase.plus(fabrication).round(2, 'half-up');

    return {
      commodityType: config.commodityType,
      pricingMode: 'SPOT',
      effectiveLmeUsdPerTon: lme.round(2, 'half-up').toNumber(),
      effectiveMidwestUsdPerTon: midwest.round(2, 'half-up').toNumber(),
      effectiveExchangeRateBrl: fx.round(4, 'half-up').toNumber(),
      metalBasePriceBrlPerTon: metalBase.toNumber(),
      fabricationPremiumBrlPerTon: fabrication.round(2, 'half-up').toNumber(),
      totalMetalPriceBrlPerTon: totalMetal.toNumber(),
      totalDeliveryWeightTons: 0,
    };
  }

  /**
   * Formação de preço por curva de futuros ponderada por entregas mensais (RN-09, RF-31).
   */
  private static calculateFuturesWeightedPrice(
    config: CommodityPricingConfig,
  ): FormedCommodityPrice {
    const curve = config.futuresCurve || [];
    let totalWeight = DecimalValue.zero();
    let sumProductLme = DecimalValue.zero();
    let sumProductMidwest = DecimalValue.zero();
    let sumProductFx = DecimalValue.zero();

    for (const entry of curve) {
      const weight = DecimalValue.of(entry.deliveryWeightTons);
      if (weight.greaterThan(DecimalValue.zero())) {
        totalWeight = totalWeight.plus(weight);
        sumProductLme = sumProductLme.plus(
          DecimalValue.of(entry.lmePriceUsdPerTon).times(weight),
        );
        sumProductMidwest = sumProductMidwest.plus(
          DecimalValue.of(entry.midwestPremiumUsdPerTon).times(weight),
        );
        sumProductFx = sumProductFx.plus(
          DecimalValue.of(entry.projectedExchangeRateBrl).times(weight),
        );
      }
    }

    // Se nenhuma tonelada foi declarada na curva, adota os valores spot como salvaguarda
    if (totalWeight.isZero()) {
      return this.calculateSpotPrice(config);
    }

    const effectiveLme = sumProductLme
      .dividedBy(totalWeight)
      .round(2, 'half-up');
    const effectiveMidwest = sumProductMidwest
      .dividedBy(totalWeight)
      .round(2, 'half-up');
    const effectiveFx = sumProductFx.dividedBy(totalWeight).round(4, 'half-up');
    const fabrication = DecimalValue.of(config.fabricationPremiumBrlPerTon);

    const metalBase = effectiveLme
      .plus(effectiveMidwest)
      .times(effectiveFx)
      .round(2, 'half-up');
    const totalMetal = metalBase.plus(fabrication).round(2, 'half-up');

    return {
      commodityType: config.commodityType,
      pricingMode: 'FUTURES_WEIGHTED',
      effectiveLmeUsdPerTon: effectiveLme.toNumber(),
      effectiveMidwestUsdPerTon: effectiveMidwest.toNumber(),
      effectiveExchangeRateBrl: effectiveFx.toNumber(),
      metalBasePriceBrlPerTon: metalBase.toNumber(),
      fabricationPremiumBrlPerTon: fabrication.round(2, 'half-up').toNumber(),
      totalMetalPriceBrlPerTon: totalMetal.toNumber(),
      totalDeliveryWeightTons: totalWeight.round(3, 'half-up').toNumber(),
    };
  }
}
