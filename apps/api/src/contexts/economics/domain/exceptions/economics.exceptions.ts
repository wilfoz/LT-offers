export class EconomicsLineNotFoundException extends Error {
  constructor(lineId: number) {
    super(`Linha de transmissão ID ${lineId} não encontrada.`);
    this.name = 'EconomicsLineNotFoundException';
  }
}

export class EconomicsOfferNotFoundException extends Error {
  constructor(offerId: number) {
    super(`Oferta ID ${offerId} não encontrada.`);
    this.name = 'EconomicsOfferNotFoundException';
  }
}
