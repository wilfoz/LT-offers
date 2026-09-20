/**
 * Exceções de negócio do domínio de Ofertas e Revisões.
 */
export class OfferDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class OfferNotFoundException extends OfferDomainException {
  constructor(offerId: number | string) {
    super(`Proposta com ID '${offerId}' não encontrada.`);
  }
}

export class RevisionNotFoundException extends OfferDomainException {
  constructor(revisionId: number | string) {
    super(`Revisão com ID '${revisionId}' não encontrada.`);
  }
}

export class RevisionFrozenException extends OfferDomainException {
  constructor(revisionNumber: number, action = 'modificar') {
    super(
      `Revisão R${revisionNumber} está congelada/fechada e não permite ${action} (RNF-05).`,
    );
  }
}

export class InvalidScopeMatrixException extends OfferDomainException {
  constructor(message: string) {
    super(`Matriz de escopo inválida: ${message}`);
  }
}

export class InvalidDestinationSharesException extends OfferDomainException {
  constructor(lineCode: string, totalPercentage: string | number) {
    super(
      `Linha '${lineCode}': o rateio percentual entre UFs de destino deve somar exatamente 100% (atual: ${totalPercentage}%).`,
    );
  }
}

export class DuplicateOfferCodeException extends OfferDomainException {
  constructor(code: string) {
    super(`Já existe uma proposta cadastrada com o código '${code}'.`);
  }
}

export class LineNotFoundException extends OfferDomainException {
  constructor(lineId: number | string) {
    super(
      `Linha de transmissão com ID '${lineId}' não encontrada nesta revisão.`,
    );
  }
}
