import { DependencyGraph } from './dependency-graph';

describe('DependencyGraph', () => {
  it('ordena dependências antes dos dependentes', () => {
    const graph = new DependencyGraph();
    graph.addDependency('quantities', 'staking');
    graph.addDependency('prices', 'quantities');
    graph.addDependency('result', 'prices');

    const order = graph.topologicalOrder();

    expect(order.indexOf('staking')).toBeLessThan(order.indexOf('quantities'));
    expect(order.indexOf('quantities')).toBeLessThan(order.indexOf('prices'));
    expect(order.indexOf('prices')).toBeLessThan(order.indexOf('result'));
  });

  it('inclui nós isolados na ordenação', () => {
    const graph = new DependencyGraph();
    graph.addNode('isolated');
    graph.addDependency('b', 'a');

    expect(graph.topologicalOrder()).toHaveLength(3);
  });

  it('lança erro ao detectar ciclo', () => {
    const graph = new DependencyGraph();
    graph.addDependency('a', 'b');
    graph.addDependency('b', 'a');

    expect(() => graph.topologicalOrder()).toThrow(/[Cc]iclo/);
  });
});
