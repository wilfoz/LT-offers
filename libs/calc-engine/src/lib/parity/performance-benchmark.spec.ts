import { SOLARIS_MG_500KV_FIXTURE } from './fixtures';
import { FullOfferPipelineRunner } from './full-offer-pipeline-runner';
import { DependencyGraph } from '../dependency-graph';

describe('Benchmark de Desempenho e Não-Regressão (RNF-01)', () => {
  let runner: FullOfferPipelineRunner;

  beforeEach(() => {
    runner = new FullOfferPipelineRunner();
  });

  it('deve executar o recálculo completo de uma oferta em tempo muito inferior ao limite de 30 s', () => {
    const iterations = 50;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      runner.run(SOLARIS_MG_500KV_FIXTURE);
    }

    const totalDurationMs = performance.now() - start;
    const avgDurationMs = totalDurationMs / iterations;

    // RNF-01 exige < 30.000 ms; o motor em TypeScript puro executa em frações de milissegundo
    expect(avgDurationMs).toBeLessThan(100);
    expect(totalDurationMs).toBeLessThan(30000);
  });

  it('deve realizar ordenação topológica e cálculo no grafo em menos de 2 s (RNF-01)', () => {
    const graph = new DependencyGraph();

    graph.addNode('Staking.Structures');
    graph.addNode('Electromechanical.Towers');
    graph.addNode('Taxes.Icms');
    graph.addNode('Result.SalePrice');

    graph.addDependency('Electromechanical.Towers', 'Staking.Structures');
    graph.addDependency('Taxes.Icms', 'Electromechanical.Towers');
    graph.addDependency('Result.SalePrice', 'Taxes.Icms');

    const start = performance.now();
    const order = graph.topologicalOrder();
    const duration = performance.now() - start;

    expect(order).toEqual([
      'Staking.Structures',
      'Electromechanical.Towers',
      'Taxes.Icms',
      'Result.SalePrice',
    ]);
    expect(duration).toBeLessThan(50);
  });
});
