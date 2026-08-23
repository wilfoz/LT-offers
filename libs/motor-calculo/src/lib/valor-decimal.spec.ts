import { ValorDecimal } from './valor-decimal';

describe('ValorDecimal', () => {
  it('soma sem erro de ponto flutuante (0,1 + 0,2 = 0,3)', () => {
    const resultado = ValorDecimal.de('0.1').somar(ValorDecimal.de('0.2'));
    expect(resultado.paraTexto()).toBe('0.3');
  });

  it('multiplica preservando precisão', () => {
    const resultado = ValorDecimal.de('1234.5678').multiplicar(
      ValorDecimal.de('0.17'),
    );
    expect(resultado.paraTexto()).toBe('209.876526');
  });

  it('arredonda com política meio-para-cima', () => {
    expect(
      ValorDecimal.de('2.345').arredondar(2, 'meio-para-cima').paraTexto(),
    ).toBe('2.35');
    expect(
      ValorDecimal.de('2.5').arredondar(0, 'meio-para-cima').paraTexto(),
    ).toBe('3');
  });

  it('arredonda com política meio-para-par', () => {
    expect(
      ValorDecimal.de('2.5').arredondar(0, 'meio-para-par').paraTexto(),
    ).toBe('2');
    expect(
      ValorDecimal.de('3.5').arredondar(0, 'meio-para-par').paraTexto(),
    ).toBe('4');
  });

  it('é imutável: operações não alteram o valor original', () => {
    const original = ValorDecimal.de('10');
    original.somar(ValorDecimal.de('5'));
    expect(original.paraTexto()).toBe('10');
  });

  it('compara igualdade por valor', () => {
    expect(ValorDecimal.de('1.50').igualA(ValorDecimal.de('1.5'))).toBe(true);
    expect(ValorDecimal.de('1.50').igualA(ValorDecimal.de('1.51'))).toBe(false);
  });
});
