import { RiskItem } from '@lt-offers/domain';
import { RiskCalculator } from './risk-calculator';

describe('RiskCalculator', () => {
  it('deve calcular a severidade ponderada de um item com precisão decimal (RF-61)', () => {
    // Impacto: R$ 2.500.000,00 x 30% = R$ 750.000,00
    const severity = RiskCalculator.calculateItemSeverity('2500000', '30');
    expect(severity).toBe('750000.00');

    // Impacto: R$ 123.456,78 x 12.5% = R$ 15.432,10
    const severity2 = RiskCalculator.calculateItemSeverity('123456.78', '12.5');
    expect(severity2).toBe('15432.10');
  });

  it('deve consolidar a Matriz de Riscos segregando contingência de BDI e premissa comercial (RF-55, RF-61)', () => {
    const items: RiskItem[] = [
      {
        id: 'r1',
        offerId: 'off-1',
        lineId: 'line-1',
        category: 'LAND_EASEMENT',
        description: 'Faixa de servidão em área urbana consolidada',
        situation:
          'Estudo preliminar indica possíveis desapropriações judiciais',
        mitigationAction: 'Adiantar contato com cartórios e proprietários',
        estimatedImpact: '1000000.00',
        probabilityPercent: '50.00',
        weightedSeverity: '0',
        treatment: 'CONTINGENCY_BDI',
      },
      {
        id: 'r2',
        offerId: 'off-1',
        lineId: 'line-1',
        category: 'GEOTECHNICAL_SOIL',
        description: 'Aumento de rocha dura na travessia de serra',
        situation: 'Sondagens preliminares com espaçamento superior a 2 km',
        mitigationAction: 'Prever equipe especializada de desmonte',
        estimatedImpact: '500000.00',
        probabilityPercent: '40.00',
        weightedSeverity: '0',
        treatment: 'CONTINGENCY_BDI',
      },
      {
        id: 'r3',
        offerId: 'off-1',
        category: 'THIRD_PARTY_MARKET',
        description: 'Variação de frete rodoviário',
        situation: 'Possível alta do diesel',
        mitigationAction:
          'Negociação de contrato com transportadora com cláusula de teto',
        estimatedImpact: '200000.00',
        probabilityPercent: '25.00',
        weightedSeverity: '0',
        treatment: 'COMMERCIAL_ASSUMPTION',
      },
    ];

    const assessment = RiskCalculator.assessRisks('off-1', items, 'line-1');

    expect(assessment.totalEstimatedImpact).toBe('1700000.00'); // 1M + 500k + 200k
    expect(assessment.totalWeightedSeverity).toBe('750000.00'); // 500k + 200k + 50k
    expect(assessment.bdiContingencyAmount).toBe('700000.00'); // 500k + 200k
    expect(assessment.commercialAssumptionAmount).toBe('50000.00'); // 50k

    const landSummary = assessment.categoryBreakdown.find(
      (c) => c.category === 'LAND_EASEMENT',
    );
    expect(landSummary?.count).toBe(1);
    expect(landSummary?.totalImpact).toBe('1000000.00');
    expect(landSummary?.totalWeightedSeverity).toBe('500000.00');
  });

  it('deve converter montante de contingência em taxa percentual sobre o custo próprio', () => {
    // R$ 700.000,00 de contingência sobre R$ 35.000.000,00 de custo próprio = 2.00%
    const rate = RiskCalculator.calculateContingencyRateFromAmount(
      '700000.00',
      '35000000.00',
    );
    expect(rate).toBe('2.00');

    // Base zero não deve lançar divisão por zero
    const zeroRate = RiskCalculator.calculateContingencyRateFromAmount(
      '700000.00',
      '0',
    );
    expect(zeroRate).toBe('0.00');
  });
});
