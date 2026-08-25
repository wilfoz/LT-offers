import { decimalScaleViolation } from './validation';

describe('decimalScaleViolation', () => {
  it('aceita decimal dentro da escala, inclusive no limite exato', () => {
    expect(decimalScaleViolation('12.34', 2)).toBeNull();
    expect(decimalScaleViolation('12.3', 2)).toBeNull();
    expect(decimalScaleViolation('12', 2)).toBeNull();
    expect(decimalScaleViolation('0.125', 3)).toBeNull();
  });

  it('rejeita formato não decimal (negativo, texto, vírgula, vazio)', () => {
    expect(decimalScaleViolation('-1', 2)).toBe('not-decimal');
    expect(decimalScaleViolation('abc', 2)).toBe('not-decimal');
    expect(decimalScaleViolation('1,5', 2)).toBe('not-decimal');
    expect(decimalScaleViolation('', 2)).toBe('not-decimal');
    expect(decimalScaleViolation('1.', 2)).toBe('not-decimal');
  });

  it('rejeita casas além da escala máxima', () => {
    expect(decimalScaleViolation('120.505', 2)).toBe('scale-exceeded');
    expect(decimalScaleViolation('146.0005', 3)).toBe('scale-exceeded');
  });

  it('sem nonZero, zero é valor informado válido (RNF-09)', () => {
    expect(decimalScaleViolation('0', 2)).toBeNull();
    expect(decimalScaleViolation('0.00', 2)).toBeNull();
  });

  it('com nonZero, zero em qualquer grafia é rejeitado como não positivo', () => {
    expect(decimalScaleViolation('0', 2, { nonZero: true })).toBe(
      'not-positive',
    );
    expect(decimalScaleViolation('0.000', 3, { nonZero: true })).toBe(
      'not-positive',
    );
    expect(decimalScaleViolation('0.001', 3, { nonZero: true })).toBeNull();
  });

  it('com nonZero, formato inválido prevalece sobre a checagem de positivo', () => {
    expect(decimalScaleViolation('-0.5', 2, { nonZero: true })).toBe(
      'not-decimal',
    );
  });
});
