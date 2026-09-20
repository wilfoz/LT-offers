export class BaselineNotFoundException extends Error {
  constructor(id: number) {
    super(`Linha de Base ID ${id} não encontrada.`);
    this.name = 'BaselineNotFoundException';
  }
}

export class NoActiveBaselineException extends Error {
  constructor(offerId: number) {
    super(`Nenhuma Linha de Base ativa encontrada para a oferta ${offerId}.`);
    this.name = 'NoActiveBaselineException';
  }
}

export class BaselineOfferNotFoundException extends Error {
  constructor(offerId: number) {
    super(`Oferta ID ${offerId} não encontrada.`);
    this.name = 'BaselineOfferNotFoundException';
  }
}

export class ChangeOrderNotFoundException extends Error {
  constructor(changeOrderId: number, baselineId: number) {
    super(
      `Change Order ID ${changeOrderId} não encontrada na baseline ${baselineId}.`,
    );
    this.name = 'ChangeOrderNotFoundException';
  }
}
