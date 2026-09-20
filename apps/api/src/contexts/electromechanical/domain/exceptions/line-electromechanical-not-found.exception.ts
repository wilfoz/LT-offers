/**
 * Exceção de domínio lançada quando a linha de transmissão não é encontrada para quantitativos eletromecânicos.
 */
export class LineElectromechanicalNotFoundException extends Error {
  constructor(public readonly lineId: number) {
    super(`Linha de transmissão ID ${lineId} não encontrada.`);
    this.name = 'LineElectromechanicalNotFoundException';
  }
}
