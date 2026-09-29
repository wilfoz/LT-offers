/** Exceções de negócio da viabilidade do lote (M13). */
export class ViabilityException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NoEffectiveViabilityParametersException extends ViabilityException {
  constructor(referenceDate: string) {
    super(
      `Nenhuma versão de parâmetros de viabilidade vigente em ${referenceDate}.`,
    );
  }
}

export class DuplicateViabilityParametersDateException extends ViabilityException {
  constructor(effectiveFrom: string) {
    super(
      `Já existe uma versão de parâmetros de viabilidade com vigência a partir de ${effectiveFrom}.`,
    );
  }
}

export class ViabilityRevisionNotFoundException extends ViabilityException {
  constructor(offerId: number, revisionId: number) {
    super(
      `Revisão com ID '${revisionId}' não encontrada na proposta '${offerId}'.`,
    );
  }
}
