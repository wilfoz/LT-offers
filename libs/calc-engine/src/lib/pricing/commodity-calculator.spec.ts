import { CommodityPricingConfig } from '@lt-offers/domain';
import { CommodityCalculator } from './commodity-calculator';

describe('CommodityCalculator (RN-07, RN-08, RN-09, RF-30, RF-31)', () => {
  it('deve calcular preço Spot de alumínio: (LME + Midwest) * Fx + Prêmio (RN-07)', () => {
    const config: CommodityPricingConfig = {
      commodityType: 'ALUMINUM',
      pricingMode: 'SPOT',
      spotLmeUsdPerTon: 2400,
      spotMidwestPremiumUsdPerTon: 450,
      spotExchangeRateBrl: 5.5,
      fabricationPremiumBrlPerTon: 3200,
    };

    // Metal Base = (2400 + 450) * 5.50 = 2850 * 5.50 = 15675.00
    // Total = 15675.00 + 3200.00 = 18875.00
    const result = CommodityCalculator.calculatePricePerTon(config);

    expect(result.pricingMode).toBe('SPOT');
    expect(result.effectiveLmeUsdPerTon).toBe(2400);
    expect(result.effectiveMidwestUsdPerTon).toBe(450);
    expect(result.effectiveExchangeRateBrl).toBe(5.5);
    expect(result.metalBasePriceBrlPerTon).toBe(15675);
    expect(result.fabricationPremiumBrlPerTon).toBe(3200);
    expect(result.totalMetalPriceBrlPerTon).toBe(18875);
  });

  it('deve calcular preço ponderado pela curva de entregas mensais (RN-09, RF-31)', () => {
    const config: CommodityPricingConfig = {
      commodityType: 'ALUMINUM',
      pricingMode: 'FUTURES_WEIGHTED',
      spotLmeUsdPerTon: 2400,
      spotMidwestPremiumUsdPerTon: 450,
      spotExchangeRateBrl: 5.5,
      fabricationPremiumBrlPerTon: 3000,
      futuresCurve: [
        {
          monthIndex: 6,
          lmePriceUsdPerTon: 2500,
          midwestPremiumUsdPerTon: 460,
          projectedExchangeRateBrl: 5.6,
          deliveryWeightTons: 300,
        },
        {
          monthIndex: 7,
          lmePriceUsdPerTon: 2600,
          midwestPremiumUsdPerTon: 470,
          projectedExchangeRateBrl: 5.7,
          deliveryWeightTons: 700,
        },
      ],
    };

    // Total Tons = 1000
    // LME Médio = (300*2500 + 700*2600)/1000 = (750000 + 1820000)/1000 = 2570000/1000 = 2570.00
    // Midwest Médio = (300*460 + 700*470)/1000 = (138000 + 329000)/1000 = 467000/1000 = 467.00
    // Fx Médio = (300*5.60 + 700*5.70)/1000 = (1680 + 3990)/1000 = 5670/1000 = 5.6700
    // Metal Base = (2570 + 467) * 5.67 = 3037 * 5.67 = 17219.79
    // Total = 17219.79 + 3000 = 20219.79
    const result = CommodityCalculator.calculatePricePerTon(config);

    expect(result.pricingMode).toBe('FUTURES_WEIGHTED');
    expect(result.effectiveLmeUsdPerTon).toBe(2570);
    expect(result.effectiveMidwestUsdPerTon).toBe(467);
    expect(result.effectiveExchangeRateBrl).toBe(5.67);
    expect(result.metalBasePriceBrlPerTon).toBe(17219.79);
    expect(result.totalMetalPriceBrlPerTon).toBe(20219.79);
    expect(result.totalDeliveryWeightTons).toBe(1000);
  });

  it('deve adotar fallback para Spot se curva de futuros não contiver toneladas entregues', () => {
    const config: CommodityPricingConfig = {
      commodityType: 'COPPER',
      pricingMode: 'FUTURES_WEIGHTED',
      spotLmeUsdPerTon: 9500,
      spotMidwestPremiumUsdPerTon: 0,
      spotExchangeRateBrl: 5.5,
      fabricationPremiumBrlPerTon: 5000,
      futuresCurve: [],
    };

    const result = CommodityCalculator.calculatePricePerTon(config);
    expect(result.pricingMode).toBe('SPOT');
    expect(result.effectiveLmeUsdPerTon).toBe(9500);
    expect(result.totalMetalPriceBrlPerTon).toBe(9500 * 5.5 + 5000);
  });
});
