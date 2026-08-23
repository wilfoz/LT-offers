/**
 * Esqueleto do grafo explícito de dependências de cálculo (arquitetura §12).
 *
 * Cada nó representa um cálculo identificável; cada aresta declara que um
 * cálculo depende do resultado de outro. A ordenação topológica define a
 * ordem de execução; nas fases seguintes ela será a base do recálculo
 * incremental do subgrafo afetado (RNF-01).
 */
export class GrafoDependencias {
  private readonly dependenciasPorNo = new Map<string, Set<string>>();

  adicionarNo(id: string): void {
    if (!this.dependenciasPorNo.has(id)) {
      this.dependenciasPorNo.set(id, new Set());
    }
  }

  /** Declara que `dependente` precisa do resultado de `dependencia`. */
  adicionarDependencia(dependente: string, dependencia: string): void {
    this.adicionarNo(dependente);
    this.adicionarNo(dependencia);
    this.dependenciasPorNo.get(dependente)?.add(dependencia);
  }

  nos(): string[] {
    return [...this.dependenciasPorNo.keys()];
  }

  /**
   * Ordena os nós de modo que toda dependência venha antes do dependente
   * (algoritmo de Kahn). Lança erro se houver ciclo — um ciclo de cálculo
   * é sempre defeito de modelagem, nunca estado válido.
   */
  ordenacaoTopologica(): string[] {
    const grausPendentes = new Map<string, number>();
    const dependentesPorNo = new Map<string, string[]>();

    for (const [no, dependencias] of this.dependenciasPorNo) {
      grausPendentes.set(no, dependencias.size);
      for (const dependencia of dependencias) {
        const dependentes = dependentesPorNo.get(dependencia) ?? [];
        dependentes.push(no);
        dependentesPorNo.set(dependencia, dependentes);
      }
    }

    const prontos = [...grausPendentes.entries()]
      .filter(([, grau]) => grau === 0)
      .map(([no]) => no);
    const ordem: string[] = [];

    while (prontos.length > 0) {
      const no = prontos.shift() as string;
      ordem.push(no);
      for (const dependente of dependentesPorNo.get(no) ?? []) {
        const grau = (grausPendentes.get(dependente) ?? 0) - 1;
        grausPendentes.set(dependente, grau);
        if (grau === 0) {
          prontos.push(dependente);
        }
      }
    }

    if (ordem.length !== this.dependenciasPorNo.size) {
      throw new Error('Ciclo de dependência detectado no grafo de cálculo');
    }

    return ordem;
  }
}
