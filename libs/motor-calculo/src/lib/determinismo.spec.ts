import { GrafoDependencias } from './grafo-dependencias';
import { ValorDecimal } from './valor-decimal';

/**
 * Testes-sentinela de determinismo (RNF-04, design D5): a mesma entrada
 * produz exatamente o mesmo resultado em execuções repetidas. Estes testes
 * ancoram o contrato antes de existir qualquer regra de negócio; toda RN
 * implementada nas próximas fases herda esta obrigação.
 */
describe('Determinismo do motor', () => {
  it('cálculo decimal repetido produz resultado idêntico byte a byte', () => {
    const calcular = () =>
      ValorDecimal.de('1234.5678')
        .multiplicar(ValorDecimal.de('0.0725'))
        .somar(ValorDecimal.de('99.99'))
        .arredondar(2, 'meio-para-cima')
        .paraTexto();

    const primeira = calcular();
    for (let i = 0; i < 100; i++) {
      expect(calcular()).toBe(primeira);
    }
  });

  it('ordenação topológica repetida produz a mesma ordem', () => {
    const montar = () => {
      const grafo = new GrafoDependencias();
      grafo.adicionarDependencia('materiais', 'quantitativos');
      grafo.adicionarDependencia('quantitativos', 'estaqueamento');
      grafo.adicionarDependencia('impostos', 'materiais');
      grafo.adicionarDependencia('resultado', 'impostos');
      grafo.adicionarDependencia('resultado', 'cronograma');
      grafo.adicionarNo('cronograma');
      return grafo.ordenacaoTopologica().join('>');
    };

    const primeira = montar();
    for (let i = 0; i < 100; i++) {
      expect(montar()).toBe(primeira);
    }
  });
});
