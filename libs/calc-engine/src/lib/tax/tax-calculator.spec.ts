import {
  ItemTaxCalculationInput,
  IcmsRule,
  IpiRule,
} from '@lt-offers/domain';
import { TaxCalculator } from './tax-calculator';

describe('TaxCalculator (RN-04, RN-05, RN-06, RF-32, RF-34)', () => {
  const icmsRulesMap: Record<string, IcmsRule> = {
    'SP->MG': {
      originState: 'SP',
      destinationState: 'MG',
      interstateRatePercent: 7.0,
      internalDestinationRatePercent: 18.0,
      fecoepRatePercent: 2.0,
      difalMethod: 'DOUBLE_BASE',
    },
    'SP->BA': {
      originState: 'SP',
      destinationState: 'BA',
      interstateRatePercent: 7.0,
      internalDestinationRatePercent: 19.0,
      fecoepRatePercent: 1.0,
      difalMethod: 'DOUBLE_BASE',
    },
    'SP->SP': {
      originState: 'SP',
      destinationState: 'SP',
      interstateRatePercent: 18.0,
      internalDestinationRatePercent: 18.0,
      fecoepRatePercent: 0.0,
      difalMethod: 'SINGLE_BASE',
    },
    'PR->SC': {
      originState: 'PR',
      destinationState: 'SC',
      interstateRatePercent: 12.0,
      internalDestinationRatePercent: 17.0,
      fecoepRatePercent: 0.0,
      difalMethod: 'SINGLE_BASE',
    },
  };

  const ipiRulesMap: Record<string, IpiRule> = {
    '7308.20.00': {
      ncmCode: '7308.20.00',
      description: 'Torres e pórticos de ferro ou aço',
      ratePercent: 3.25,
    },
  };

  it('deve calcular impostos em operação interna sem DIFAL (SP -> SP)', () => {
    const input: ItemTaxCalculationInput = {
      itemCode: 'TOR-EST-01',
      itemName: 'Torre de Suspensão TS',
      netUnitPrice: 10000,
      quantity: 1,
      originState: 'SP',
      destinations: [{ state: 'SP', sharePercent: 100 }],
      taxRegime: 'STANDARD',
      ncmCode: '7308.20.00',
    };

    const result = TaxCalculator.calculateItemTaxes(
      input,
      icmsRulesMap,
      ipiRulesMap,
    );

    // Base = 10000
    // IPI = 3.25% * 10000 = 325.00
    // ICMS Origem (18%) = 1800.00 (embutido na operação interna)
    // DIFAL = 0, FECOEP = 0
    // PIS = 1.65% * 10000 = 165.00
    // COFINS = 7.60% * 10000 = 760.00
    // Total Impostos agregados = 325 + 0 + 0 + 165 + 760 = 1250.00
    // Total Bruto = 10000 + 1250 = 11250.00

    expect(result.netTotalAmount).toBe(10000);
    expect(result.ipiAmount).toBe(325);
    expect(result.totalDifalAmount).toBe(0);
    expect(result.totalFecoepAmount).toBe(0);
    expect(result.pisAmount).toBe(165);
    expect(result.cofinsAmount).toBe(760);
    expect(result.totalTaxesAmount).toBe(1250);
    expect(result.grossTotalAmount).toBe(11250);
  });

  it('deve calcular DIFAL por Base Dupla com FECOEP (SP -> MG) (RN-05)', () => {
    const input: ItemTaxCalculationInput = {
      itemCode: 'CAB-DRAKE',
      itemName: 'Cabo CAA Drake',
      netUnitPrice: 100000,
      quantity: 1,
      originState: 'SP',
      destinations: [{ state: 'MG', sharePercent: 100 }],
      taxRegime: 'STANDARD',
      customIpiRatePercent: 0,
    };

    const result = TaxCalculator.calculateItemTaxes(input, icmsRulesMap);

    // Base Origem = 100.000,00
    // ICMS Origem (7%) = 7.000,00
    // MG: Alíquota Interna = 18%, FECOEP = 2% -> Total Destino = 20%
    // Base Destino Reconstituída = (100.000 - 7.000) / (1 - 0.20) = 93.000 / 0.80 = 116.250,00
    // ICMS Destino Total = 116.250,00 * 18% = 20.925,00
    // DIFAL = 20.925,00 - 7.000,00 = 13.925,00
    // FECOEP = 116.250,00 * 2% = 2.325,00
    // PIS (1.65%) = 1.650,00
    // COFINS (7.60%) = 7.600,00
    // Total Impostos = 0 (IPI) + 13.925 + 2.325 + 1.650 + 7.600 = 25.500,00
    // Preço Bruto = 100.000 + 25.500 = 125.500,00

    expect(result.netTotalAmount).toBe(100000);
    expect(result.totalIcmsOriginAmount).toBe(7000);
    expect(result.totalDifalAmount).toBe(13925);
    expect(result.totalFecoepAmount).toBe(2325);
    expect(result.pisAmount).toBe(1650);
    expect(result.cofinsAmount).toBe(7600);
    expect(result.totalTaxesAmount).toBe(25500);
    expect(result.grossTotalAmount).toBe(125500);
  });

  it('deve calcular DIFAL por Base Simples (PR -> SC) (RN-05)', () => {
    const input: ItemTaxCalculationInput = {
      itemCode: 'ISOL-VIDRO',
      itemName: 'Isolador de Vidro 120 kN',
      netUnitPrice: 50000,
      quantity: 1,
      originState: 'PR',
      destinations: [{ state: 'SC', sharePercent: 100 }],
      taxRegime: 'STANDARD',
      customIpiRatePercent: 0,
    };

    const result = TaxCalculator.calculateItemTaxes(input, icmsRulesMap);

    // Base = 50.000,00
    // ICMS Origem (12%) = 6.000,00
    // SC: Interna = 17%, Inter = 12% -> DIFAL = 50.000 * (17% - 12%) = 2.500,00
    // FECOEP = 0
    // PIS = 825,00 (1.65%)
    // COFINS = 3.800,00 (7.60%)
    // Total Impostos = 2.500 + 825 + 3.800 = 7.125,00
    // Preço Bruto = 57.125,00

    expect(result.totalIcmsOriginAmount).toBe(6000);
    expect(result.totalDifalAmount).toBe(2500);
    expect(result.totalFecoepAmount).toBe(0);
    expect(result.totalTaxesAmount).toBe(7125);
    expect(result.grossTotalAmount).toBe(57125);
  });

  it('deve desonerar PIS/COFINS sob regime REIDI e registrar benefício (RN-04)', () => {
    const input: ItemTaxCalculationInput = {
      itemCode: 'CAB-DRAKE',
      itemName: 'Cabo CAA Drake',
      netUnitPrice: 100000,
      quantity: 1,
      originState: 'SP',
      destinations: [{ state: 'MG', sharePercent: 100 }],
      taxRegime: 'REIDI',
      customIpiRatePercent: 0,
    };

    const result = TaxCalculator.calculateItemTaxes(input, icmsRulesMap);

    expect(result.pisAmount).toBe(0);
    expect(result.cofinsAmount).toBe(0);
    // Economia REIDI = 1.650 + 7.600 = 9.250,00
    expect(result.reidiBenefitAmount).toBe(9250);
    // Total Impostos = DIFAL (13.925) + FECOEP (2.325) = 16.250,00
    expect(result.totalTaxesAmount).toBe(16250);
    expect(result.grossTotalAmount).toBe(116250);
  });

  it('deve ratear impostos proporcionalmente quando a LT possui 2 UFs de destino (RN-01, RN-05)', () => {
    const input: ItemTaxCalculationInput = {
      itemCode: 'CAB-DRAKE',
      itemName: 'Cabo CAA Drake',
      netUnitPrice: 100000,
      quantity: 1,
      originState: 'SP',
      destinations: [
        { state: 'MG', sharePercent: 70 },
        { state: 'SP', sharePercent: 30 },
      ],
      taxRegime: 'REIDI',
      customIpiRatePercent: 0,
    };

    const result = TaxCalculator.calculateItemTaxes(input, icmsRulesMap);

    // MG (70% de 100.000 = 70.000 de base):
    // DIFAL MG = 13.925 * 0.7 = 9.747,50
    // FECOEP MG = 2.325 * 0.7 = 1.627,50
    // SP (30% de 100.000 = 30.000 de base):
    // DIFAL SP = 0, FECOEP SP = 0
    // Total DIFAL = 9.747,50
    // Total FECOEP = 1.627,50

    expect(result.destinationBreakdowns.length).toBe(2);
    expect(result.totalDifalAmount).toBe(9747.5);
    expect(result.totalFecoepAmount).toBe(1627.5);
    expect(result.totalTaxesAmount).toBe(11375);
    expect(result.grossTotalAmount).toBe(111375);
  });
});
