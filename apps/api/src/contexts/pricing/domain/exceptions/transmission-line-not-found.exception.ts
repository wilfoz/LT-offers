export class TransmissionLineNotFoundException extends Error {
  constructor(lineId: number) {
    super(`Linha de transmissão com ID ${lineId} não encontrada`);
    this.name = 'TransmissionLineNotFoundException';
  }
}
