/**
 * Exceção lançada quando a linha de transmissão não é encontrada para o cálculo de fundações.
 */
export class LineFoundationsNotFoundException extends Error {
  constructor(lineId: number) {
    super(`Linha de transmissão com ID ${lineId} não encontrada`);
    this.name = 'LineFoundationsNotFoundException';
  }
}
