import { GrafoDependencias } from './grafo-dependencias';

describe('GrafoDependencias', () => {
  it('ordena dependências antes dos dependentes', () => {
    const grafo = new GrafoDependencias();
    grafo.adicionarDependencia('quantitativos', 'estaqueamento');
    grafo.adicionarDependencia('precos', 'quantitativos');
    grafo.adicionarDependencia('resultado', 'precos');

    const ordem = grafo.ordenacaoTopologica();

    expect(ordem.indexOf('estaqueamento')).toBeLessThan(
      ordem.indexOf('quantitativos'),
    );
    expect(ordem.indexOf('quantitativos')).toBeLessThan(
      ordem.indexOf('precos'),
    );
    expect(ordem.indexOf('precos')).toBeLessThan(ordem.indexOf('resultado'));
  });

  it('inclui nós isolados na ordenação', () => {
    const grafo = new GrafoDependencias();
    grafo.adicionarNo('solitario');
    grafo.adicionarDependencia('b', 'a');

    expect(grafo.ordenacaoTopologica()).toHaveLength(3);
  });

  it('lança erro ao detectar ciclo', () => {
    const grafo = new GrafoDependencias();
    grafo.adicionarDependencia('a', 'b');
    grafo.adicionarDependencia('b', 'a');

    expect(() => grafo.ordenacaoTopologica()).toThrow(/[Cc]iclo/);
  });
});
