/**
 * Resolução de vigência (spec catalogos/versionamento-vigencia): a versão
 * vigente para uma data de referência é a de maior effectiveFrom menor ou
 * igual à data. Funções puras — a data de referência chega sempre como
 * parâmetro.
 */

export interface HasEffectiveFrom {
  effectiveFrom: Date;
}

export function resolveEffectiveVersion<T extends HasEffectiveFrom>(
  versions: T[],
  referenceDate: Date,
): T | undefined {
  return versions
    .filter((v) => v.effectiveFrom.getTime() <= referenceDate.getTime())
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];
}

/** null/undefined ou texto em branco = não informado, distinto de zero (RNF-09). */
export function isMissing(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  return typeof value === 'string' && value.trim() === '';
}

/**
 * Campos obrigatórios não informados, por mapa campo→rótulo pt-BR — cada
 * catálogo declara seu mapa e chama o genérico (RF-11, RNF-09).
 */
export function missingFields<K extends string>(
  version: Partial<Record<K, unknown>>,
  labels: Partial<Record<K, string>>,
): string[] {
  return (Object.entries(labels) as [K, string][])
    .filter(([field]) => isMissing(version[field]))
    .map(([, label]) => label);
}
