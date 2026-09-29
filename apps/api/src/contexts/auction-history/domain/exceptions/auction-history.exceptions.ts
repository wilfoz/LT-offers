/**
 * Exceções de negócio do histórico de leilões. Falha da fonte externa nunca
 * corrompe o snapshot vigente: a sincronização aborta antes de escrever.
 */
export class AuctionHistoryException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class AneelSourceUnavailableException extends AuctionHistoryException {
  constructor(detail: string) {
    super(
      `Fonte de dados da ANEEL indisponível: ${detail}. O snapshot local permanece inalterado.`,
    );
  }
}

export class AneelDatasetInvalidException extends AuctionHistoryException {
  constructor(detail: string) {
    super(
      `Resposta da ANEEL fora do esquema esperado: ${detail}. A sincronização foi abortada e o snapshot local permanece inalterado.`,
    );
  }
}
