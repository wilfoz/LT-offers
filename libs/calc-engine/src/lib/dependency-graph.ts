/**
 * Esqueleto do grafo explícito de dependências de cálculo (arquitetura §12).
 *
 * Cada nó representa um cálculo identificável; cada aresta declara que um
 * cálculo depende do resultado de outro. A ordenação topológica define a
 * ordem de execução; nas fases seguintes ela será a base do recálculo
 * incremental do subgrafo afetado (RNF-01).
 */
export class DependencyGraph {
  private readonly dependenciesByNode = new Map<string, Set<string>>();

  addNode(id: string): void {
    if (!this.dependenciesByNode.has(id)) {
      this.dependenciesByNode.set(id, new Set());
    }
  }

  /** Declara que `dependent` precisa do resultado de `dependency`. */
  addDependency(dependent: string, dependency: string): void {
    this.addNode(dependent);
    this.addNode(dependency);
    this.dependenciesByNode.get(dependent)?.add(dependency);
  }

  nodes(): string[] {
    return [...this.dependenciesByNode.keys()];
  }

  /**
   * Ordena os nós de modo que toda dependência venha antes do dependente
   * (algoritmo de Kahn). Lança erro se houver ciclo — um ciclo de cálculo
   * é sempre defeito de modelagem, nunca estado válido.
   */
  topologicalOrder(): string[] {
    const pendingDegree = new Map<string, number>();
    const dependentsByNode = new Map<string, string[]>();

    for (const [node, dependencies] of this.dependenciesByNode) {
      pendingDegree.set(node, dependencies.size);
      for (const dependency of dependencies) {
        const dependents = dependentsByNode.get(dependency) ?? [];
        dependents.push(node);
        dependentsByNode.set(dependency, dependents);
      }
    }

    const ready = [...pendingDegree.entries()]
      .filter(([, degree]) => degree === 0)
      .map(([node]) => node);
    const order: string[] = [];

    while (ready.length > 0) {
      const node = ready.shift() as string;
      order.push(node);
      for (const dependent of dependentsByNode.get(node) ?? []) {
        const degree = (pendingDegree.get(dependent) ?? 0) - 1;
        pendingDegree.set(dependent, degree);
        if (degree === 0) {
          ready.push(dependent);
        }
      }
    }

    if (order.length !== this.dependenciesByNode.size) {
      throw new Error('Ciclo de dependência detectado no grafo de cálculo');
    }

    return order;
  }
}
