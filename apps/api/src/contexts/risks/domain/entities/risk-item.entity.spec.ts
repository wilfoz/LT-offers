import { RiskItem } from './risk-item.entity';

describe('RiskItem Domain Entity (Regra Pura de Severidade)', () => {
  it('deve calcular a severidade ponderada corretamente: impacto * probabilidade / 100', () => {
    const severity = RiskItem.calculateSeverity('500000.00', '20.00');
    expect(severity).toBe('100000.00');
  });

  it('deve criar uma entidade RiskItem com severidade recalculada e campos formatados', () => {
    const risk = RiskItem.create({
      id: 'risk-123',
      offerId: '1',
      category: 'LAND_EASEMENT',
      description: 'Negociação de servidão',
      situation: 'Levantamento cartorial preliminar',
      mitigationAction: 'Mobilização precoce',
      estimatedImpact: '650000.00',
      probabilityPercent: '30.00',
      treatment: 'CONTINGENCY_BDI',
      lineId: '10',
    });

    expect(risk.id).toBe('risk-123');
    expect(risk.offerId).toBe('1');
    expect(risk.lineId).toBe('10');
    expect(risk.estimatedImpact).toBe('650000.00');
    expect(risk.probabilityPercent).toBe('30.00');
    expect(risk.weightedSeverity).toBe('195000.00'); // 650000 * 0.30
    expect(risk.treatment).toBe('CONTINGENCY_BDI');
  });
});
