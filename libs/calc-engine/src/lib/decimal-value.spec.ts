import { DecimalValue } from './decimal-value';

describe('DecimalValue', () => {
  it('soma sem erro de ponto flutuante (0,1 + 0,2 = 0,3)', () => {
    const result = DecimalValue.of('0.1').plus(DecimalValue.of('0.2'));
    expect(result.toText()).toBe('0.3');
  });

  it('multiplica preservando precisão', () => {
    const result = DecimalValue.of('1234.5678').times(DecimalValue.of('0.17'));
    expect(result.toText()).toBe('209.876526');
  });

  it('arredonda com política half-up', () => {
    expect(DecimalValue.of('2.345').round(2, 'half-up').toText()).toBe('2.35');
    expect(DecimalValue.of('2.5').round(0, 'half-up').toText()).toBe('3');
  });

  it('arredonda com política half-even', () => {
    expect(DecimalValue.of('2.5').round(0, 'half-even').toText()).toBe('2');
    expect(DecimalValue.of('3.5').round(0, 'half-even').toText()).toBe('4');
  });

  it('é imutável: operações não alteram o valor original', () => {
    const original = DecimalValue.of('10');
    original.plus(DecimalValue.of('5'));
    expect(original.toText()).toBe('10');
  });

  it('compara igualdade por valor', () => {
    expect(DecimalValue.of('1.50').equals(DecimalValue.of('1.5'))).toBe(true);
    expect(DecimalValue.of('1.50').equals(DecimalValue.of('1.51'))).toBe(false);
  });
});
