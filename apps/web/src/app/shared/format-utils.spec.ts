import { formatMoney, formatPercent, formatPoints } from './format-utils';

describe('format-utils (formatadores pt-BR compartilhados)', () => {
  it('formata valores monetários em pt-BR e preserva "não informado" para nulo', () => {
    expect(formatMoney('4110000000.00')).toBe('4.110.000.000,00');
    expect(formatMoney(null)).toBe('não informado');
  });

  it('formata percentuais e pontos percentuais com vírgula', () => {
    expect(formatPercent('34.88')).toBe('34,88%');
    expect(formatPercent('-4.90')).toBe('-4,90%');
    expect(formatPercent(null)).toBe('não informado');
    expect(formatPoints('11.49')).toBe('11,49 p.p.');
  });

  it('zero negativo ("-0.00") é exibido sem o sinal (artefato de arredondamento)', () => {
    expect(formatPercent('-0.00')).toBe('0,00%');
    expect(formatPoints('-0.00')).toBe('0,00 p.p.');
    expect(formatMoney('-0.00')).toBe('0,00');
  });
});
