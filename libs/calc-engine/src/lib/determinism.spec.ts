import { DependencyGraph } from './dependency-graph';
import { DecimalValue } from './decimal-value';

/**
 * Testes-sentinela de determinismo (RNF-04): a mesma entrada produz
 * exatamente o mesmo resultado em execuções repetidas. Ancoram o contrato
 * antes de existir qualquer regra de negócio; toda RN implementada nas
 * próximas fases herda esta obrigação.
 */
describe('Determinismo do motor', () => {
  it('cálculo decimal repetido produz resultado idêntico byte a byte', () => {
    const compute = () =>
      DecimalValue.of('1234.5678')
        .times(DecimalValue.of('0.0725'))
        .plus(DecimalValue.of('99.99'))
        .round(2, 'half-up')
        .toText();

    const first = compute();
    for (let i = 0; i < 100; i++) {
      expect(compute()).toBe(first);
    }
  });

  it('ordenação topológica repetida produz a mesma ordem', () => {
    const build = () => {
      const graph = new DependencyGraph();
      graph.addDependency('materials', 'quantities');
      graph.addDependency('quantities', 'staking');
      graph.addDependency('taxes', 'materials');
      graph.addDependency('result', 'taxes');
      graph.addDependency('result', 'schedule');
      graph.addNode('schedule');
      return graph.topologicalOrder().join('>');
    };

    const first = build();
    for (let i = 0; i < 100; i++) {
      expect(build()).toBe(first);
    }
  });
});
