/**
 * Exceção de domínio quando uma linha de transmissão não é encontrada para o cronograma ou canteiros.
 */
export class LineScheduleNotFoundException extends Error {
  constructor(public readonly lineId: number) {
    super(`Linha de transmissão ID ${lineId} não encontrada.`);
    this.name = 'LineScheduleNotFoundException';
  }
}
