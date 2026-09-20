/**
 * Exceção de domínio quando um item de risco não é encontrado.
 */
export class RiskNotFoundException extends Error {
  constructor(public readonly riskId: string) {
    super(`Risco ID ${riskId} não encontrado.`);
    this.name = 'RiskNotFoundException';
  }
}
