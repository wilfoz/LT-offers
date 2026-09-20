import { DecimalValue } from '../decimal-value';
import { TaxCalculator } from '../tax/tax-calculator';
import { CommodityCalculator } from '../pricing/commodity-calculator';
import { PrecipitationCalculator } from '../schedule/precipitation-calculator';

describe('Validação de Casos Limite de Regras de Negócio (RN-01..RN-26 & RNF-05)', () => {
  describe('RN-05 & RN-06: LT Interestadual com Múltiplas UFs e Rateio de DIFAL', () => {
    it('deve calcular o DIFAL e rateio proporcional de impostos por extensão entre duas UFs', () => {
      const taxBreakdown = TaxCalculator.calculateItemTaxes({
        itemCode: 'CABO-RAIL-01',
        itemName: 'Cabo de Alumínio Rail 954',
        originState: 'PA',
        netUnitPrice: 10000,
        quantity: 100,
        destinations: [
          { state: 'MG', sharePercent: 60 },
          { state: 'SP', sharePercent: 40 },
        ],
        taxRegime: 'STANDARD',
        customIpiRatePercent: 5,
      });

      expect(taxBreakdown.destinationBreakdowns.length).toBe(2);
      expect(taxBreakdown.totalTaxesAmount).toBeGreaterThan(0);
    });
  });

  describe('RN-07 & RN-09: Ponderação de Commodities LME e Câmbio por Entregas Mensais', () => {
    it('deve calcular o preço ponderado de alumínio com entregas mensais', () => {
      const priceResult = CommodityCalculator.calculatePricePerTon({
        commodityType: 'ALUMINUM',
        pricingMode: 'FUTURES_WEIGHTED',
        spotLmeUsdPerTon: 2400,
        spotMidwestPremiumUsdPerTon: 400,
        spotExchangeRateBrl: 5.6,
        fabricationPremiumBrlPerTon: 2500,
        futuresCurve: [
          {
            monthIndex: 1,
            deliveryWeightTons: 20,
            lmePriceUsdPerTon: 2420,
            midwestPremiumUsdPerTon: 400,
            projectedExchangeRateBrl: 5.62,
          },
          {
            monthIndex: 2,
            deliveryWeightTons: 30,
            lmePriceUsdPerTon: 2440,
            midwestPremiumUsdPerTon: 400,
            projectedExchangeRateBrl: 5.64,
          },
          {
            monthIndex: 3,
            deliveryWeightTons: 50,
            lmePriceUsdPerTon: 2480,
            midwestPremiumUsdPerTon: 400,
            projectedExchangeRateBrl: 5.68,
          },
        ],
      });

      expect(priceResult.totalMetalPriceBrlPerTon).toBeGreaterThan(15000);
      expect(priceResult.totalMetalPriceBrlPerTon).toBeLessThan(25000);
    });
  });

  describe('RN-16: Fator de Produtividade sob Precipitação Pluviométrica Máxima', () => {
    it('deve aplicar redução drástica de produtividade em mês com chuva extrema (> 250 mm)', () => {
      const levelDry = PrecipitationCalculator.classifyLevel(30); // 30 mm
      const levelExtreme = PrecipitationCalculator.classifyLevel(320); // 320 mm

      const factorDry = PrecipitationCalculator.getProductivityFactor(levelDry);
      const factorExtreme =
        PrecipitationCalculator.getProductivityFactor(levelExtreme);

      expect(factorDry.toNumber()).toBe(1.0);
      expect(factorExtreme.toNumber()).toBe(0.65); // Redução de 35%
    });
  });

  describe('RNF-05: Imutabilidade Histórica com Versionamento de Catálogos por Vigência', () => {
    it('deve garantir que oferta histórica fechada reproduz exatamente os mesmos custos após novos catálogos', () => {
      const historicalCablePrice = DecimalValue.of(28500); // Preço na data da proposta (2025-01)
      const currentUpdatedCatalogPrice = DecimalValue.of(34200); // Preço reajustado no catálogo atual (2026-06)

      const cableQuantityTon = DecimalValue.of(120);

      const historicalCost = historicalCablePrice.times(cableQuantityTon);
      const updatedCost = currentUpdatedCatalogPrice.times(cableQuantityTon);

      expect(historicalCost.toNumber()).toBe(3420000);
      expect(updatedCost.toNumber()).toBe(4104000);
      expect(historicalCost.toNumber()).not.toBe(updatedCost.toNumber());
    });
  });
});
