import {
  SUPPORTED_CURRENCIES,
  CURRENCY_LABELS,
  COMMODITY_TYPES,
  COMMODITY_TYPE_LABELS,
  COMMODITY_PRICING_MODES,
  MaterialQuote,
  CommodityPricingConfig,
} from './';

describe('Pricing Domain Contracts (RF-28, RF-30, RN-07)', () => {
  it('deve possuir suporte a moedas BRL, USD e EUR com labels em pt-BR', () => {
    expect(SUPPORTED_CURRENCIES).toEqual(['BRL', 'USD', 'EUR']);
    expect(CURRENCY_LABELS.BRL).toBe('Real (R$)');
    expect(CURRENCY_LABELS.USD).toBe('Dólar Americano (US$)');
    expect(CURRENCY_LABELS.EUR).toBe('Euro (€)');
  });

  it('deve suportar tipos de commodities metálicas e modos spot e futuros', () => {
    expect(COMMODITY_TYPES).toContain('ALUMINUM');
    expect(COMMODITY_TYPES).toContain('COPPER');
    expect(COMMODITY_TYPE_LABELS.ALUMINUM).toContain('Alumínio');
    expect(COMMODITY_PRICING_MODES).toEqual(['SPOT', 'FUTURES_WEIGHTED']);
  });

  it('deve instanciar uma cotação de material válida', () => {
    const quote: MaterialQuote = {
      id: 'quote-1',
      materialCode: 'CAB-CAA-DRAKE',
      materialName: 'Cabo de Alumínio CAA Drake 795 kcmil',
      supplierName: 'Fabricante de Cabos S/A',
      supplierState: 'SP',
      unit: 't',
      unitPrice: 18500,
      currency: 'BRL',
      exchangeRateToBrl: 1.0,
      isWinner: true,
    };
    expect(quote.isWinner).toBe(true);
    expect(quote.currency).toBe('BRL');
  });

  it('deve instanciar uma configuração de precificação de commodity válida', () => {
    const config: CommodityPricingConfig = {
      commodityType: 'ALUMINUM',
      pricingMode: 'FUTURES_WEIGHTED',
      spotLmeUsdPerTon: 2400,
      spotMidwestPremiumUsdPerTon: 450,
      spotExchangeRateBrl: 5.5,
      fabricationPremiumBrlPerTon: 3200,
      futuresCurve: [
        {
          monthIndex: 1,
          lmePriceUsdPerTon: 2450,
          midwestPremiumUsdPerTon: 450,
          projectedExchangeRateBrl: 5.52,
          deliveryWeightTons: 150,
        },
      ],
    };
    expect(config.futuresCurve?.length).toBe(1);
    expect(config.pricingMode).toBe('FUTURES_WEIGHTED');
  });
});
