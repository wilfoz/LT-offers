/**
 * Detector de pendências técnicas (RNF-09).
 * Distingue explicitamente valores ausentes (null, undefined ou string vazia) de zero.
 */
export class PendingFieldDetector {
  /**
   * Verifica se um valor está ausente/não informado.
   */
  public static isMissing(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    return typeof value === 'string' && value.trim() === '';
  }

  /**
   * Identifica rótulos de campos obrigatórios não preenchidos na versão.
   */
  public static detectMissing<K extends string>(
    version: Partial<Record<K, unknown>>,
    labels: Partial<Record<K, string>>,
  ): string[] {
    return (Object.entries(labels) as [K, string][])
      .filter(([field]) => this.isMissing(version[field]))
      .map(([, label]) => label);
  }
}
