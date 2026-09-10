import {
  LineMaterialPricingInput,
  MaterialPricingCalculator,
} from './material-pricing-calculator';

describe('MaterialPricingCalculator (M06, RF-28, RF-29, RF-32, RF-34)', () => {
  it('deve precificar materiais combinando cotações, commodities e tributos com precisão', () => {
    const input: LineMaterialPricingInput = {
      lineId: 'line-1',
      lineName: 'LT 500 kV Poções III - Padre Paraíso',
      taxRegime: 'REIDI',
      destinations: [{ state: 'MG', sharePercent: 100 }],
      quotesMap: {
        'TOR-TS': {
          id: 'q-1',
          materialCode: 'TOR-TS',
          materialName: 'Torre de Suspensão TS',
          supplierName: 'Estruturas Metálicas S/A',
          supplierState: 'SP',
          unit: 't',
          unitPrice: 12000,
          currency: 'BRL',
          exchangeRateToBrl: 1.0,
          isWinner: true,
        },
        'ISOL-120': {
          id: 'q-2',
          materialCode: 'ISOL-120',
          materialName: 'Isolador de Vidro 120 kN',
          supplierName: 'Global Insulators Inc',
          supplierState: 'SP',
          unit: 'un',
          unitPrice: 20, // 20 USD
          currency: 'USD',
          exchangeRateToBrl: 5.5, // 20 * 5.50 = 110 BRL
          isWinner: true,
        },
      },
      items: [
        {
          materialCode: 'TOR-TS',
          materialName: 'Torre de Suspensão TS',
          unit: 't',
          quantity: 10,
          customIpiPercent: 3.25,
        },
        {
          materialCode: 'CAB-DRAKE',
          materialName: 'Cabo CAA Drake',
          unit: 't',
          quantity: 5,
          isCommodityLinked: true,
          commodityConfig: {
            commodityType: 'ALUMINUM',
            pricingMode: 'SPOT',
            spotLmeUsdPerTon: 2400,
            spotMidwestPremiumUsdPerTon: 450,
            spotExchangeRateBrl: 5.5,
            fabricationPremiumBrlPerTon: 3200,
          },
        },
        {
          materialCode: 'ISOL-120',
          materialName: 'Isolador de Vidro 120 kN',
          unit: 'un',
          quantity: 100,
        },
        {
          materialCode: 'GRAMPO-SUSP',
          materialName: 'Grampo de Suspensão',
          unit: 'un',
          quantity: 50,
          // Sem cotação fornecida -> deve ser sinalizado em missingPriceItemCodes
        },
      ],
      icmsRulesMap: {
        'SP->MG': {
          originState: 'SP',
          destinationState: 'MG',
          interstateRatePercent: 7.0,
          internalDestinationRatePercent: 18.0,
          fecoepRatePercent: 2.0,
          difalMethod: 'DOUBLE_BASE',
        },
      },
    };

    const summary = MaterialPricingCalculator.calculateLinePricing(input);

    expect(summary.lineId).toBe('line-1');
    expect(summary.taxRegime).toBe('REIDI');
    expect(summary.items.length).toBe(4);

    // Item 1 (Torre): 10 * 12000 = 120.000 Líquido
    const torItem = summary.items.find((i) => i.itemCode === 'TOR-TS');
    expect(torItem?.netTotalAmount).toBe(120000);
    expect(torItem?.ipiAmount).toBe(3900); // 3.25% de 120.000

    // Item 2 (Cabo Alumínio): Preço Tonelada = (2400 + 450) * 5.50 + 3200 = 18.875
    // Total 5 t = 94.375 Líquido
    const cabItem = summary.items.find((i) => i.itemCode === 'CAB-DRAKE');
    expect(cabItem?.netUnitPrice).toBe(18875);
    expect(cabItem?.netTotalAmount).toBe(94375);

    // Item 3 (Isolador em USD): 100 un * (20 * 5.50 = 110) = 11.000 Líquido
    const isolItem = summary.items.find((i) => i.itemCode === 'ISOL-120');
    expect(isolItem?.netUnitPrice).toBe(110);
    expect(isolItem?.netTotalAmount).toBe(11000);

    // Item 4 (Grampo): Sem preço com quantitativo > 0
    expect(summary.missingPriceItemCodes).toEqual(['GRAMPO-SUSP']);

    // Totais
    expect(summary.totalNetAmount).toBe(120000 + 94375 + 11000);
    expect(summary.totalGrossAmount).toBeGreaterThan(summary.totalNetAmount);
    expect(summary.totalReidiSavings).toBeGreaterThan(0);
  });
});
